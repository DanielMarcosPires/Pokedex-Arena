const assert = require("node:assert/strict");
const { test } = require("node:test");
const { io: connect } = require("socket.io-client");
const { createGameServer, generateRoomCode, normalizeTeam, validActionList } = require("./server");

function makeTeam(offset = 0, name = "Jogador") {
    return {
        name,
        slots: Array.from({ length: 6 }, (_, index) => ({
            pokemonId: offset + index + 1,
            heldItem: null,
            moveNames: ["tackle", "growl", "quick-attack", "protect"]
        }))
    };
}

function makeAction(overrides = {}) {
    return {
        teamIndex: 0,
        activeSlot: 0,
        attackerIndex: 0,
        moveName: "tackle",
        targetTeamIndex: 1,
        targetActiveSlot: 0,
        targetUnavailable: false,
        megaEvolve: false,
        switchToIndex: null,
        ...overrides
    };
}

function once(socket, eventName) {
    return new Promise((resolve) => socket.once(eventName, resolve));
}

function request(socket, eventName, payload) {
    return new Promise((resolve) => socket.emit(eventName, payload, resolve));
}

async function createTestHarness(context) {
    const gameServer = createGameServer();
    await new Promise((resolve) => gameServer.server.listen(0, "127.0.0.1", resolve));

    const { port } = gameServer.server.address();
    const url = `http://127.0.0.1:${port}`;
    const clients = [];

    context.after(async () => {
        for (const client of clients) {
            if (client.connected) client.disconnect();
        }
        await new Promise((resolve) => gameServer.io.close(resolve));
    });

    async function connectClient() {
        const client = connect(url, { transports: ["websocket"], reconnection: false });
        clients.push(client);
        await once(client, "connect");
        return client;
    }

    return { gameServer, connectClient };
}

test("validates room codes, teams, and action payloads", () => {
    assert.match(generateRoomCode(), /^[A-Z0-9]{6}$/);

    const validTeam = normalizeTeam(makeTeam());
    assert.equal(validTeam.slots.length, 6);

    const shortTeam = { ...makeTeam(), slots: makeTeam().slots.slice(0, 5) };
    assert.equal(normalizeTeam(shortTeam), null);

    const duplicateTeam = makeTeam();
    duplicateTeam.slots[5].pokemonId = duplicateTeam.slots[0].pokemonId;
    assert.equal(normalizeTeam(duplicateTeam), null);

    assert.equal(validActionList([makeAction()], 0, 1), true);
    assert.equal(validActionList([{ ...makeTeam().slots[0], teamIndex: 0 }], 0, 1), false);
});

test("manages room creation, capacity limit, and team synchronization", async (context) => {
    const { connectClient } = await createTestHarness(context);
    const host = await connectClient();
    const guest = await connectClient();
    const thirdPlayer = await connectClient();

    const created = await request(host, "room:create", {});
    assert.equal(created.ok, true);

    const joined = await request(guest, "room:join", { roomCode: created.roomCode });
    assert.equal(joined.ok, true);

    const extraJoin = await request(thirdPlayer, "room:join", { roomCode: created.roomCode });
    assert.equal(extraJoin.ok, false);

    const [hostTeams, guestTeams, hostSubmit, guestSubmit] = await Promise.all([
        once(host, "room:teams-ready"),
        once(guest, "room:teams-ready"),
        request(host, "room:submit-team", { roomCode: created.roomCode, team: makeTeam(0, "Host") }),
        request(guest, "room:submit-team", { roomCode: created.roomCode, team: makeTeam(20, "Guest") })
    ]);

    assert.equal(hostSubmit.ok, true);
    assert.equal(guestSubmit.ok, true);
    assert.equal(hostTeams.teams.length, 2);
    assert.equal(guestTeams.teams.length, 2);
});

test("relays battle ready, turn actions, duplicate rejection, and state updates", async (context) => {
    const { connectClient } = await createTestHarness(context);
    const host = await connectClient();
    const guest = await connectClient();

    const { roomCode } = await request(host, "room:create", {});
    await request(guest, "room:join", { roomCode });

    await Promise.all([
        once(host, "room:teams-ready"),
        once(guest, "room:teams-ready"),
        request(host, "room:submit-team", { roomCode, team: makeTeam(0) }),
        request(guest, "room:submit-team", { roomCode, team: makeTeam(20) })
    ]);

    await Promise.all([
        once(host, "battle:ready"),
        once(guest, "battle:ready"),
        request(host, "battle:ready", { roomCode }),
        request(guest, "battle:ready", { roomCode })
    ]);

    const hostActionPayload = makeAction({ teamIndex: 0, targetTeamIndex: 1 });
    const [relayedHostAction, firstHostActionRes] = await Promise.all([
        once(guest, "battle:team-actions"),
        request(host, "battle:team-actions", {
            roomCode,
            turn: 1,
            teamIndex: 0,
            actions: [hostActionPayload]
        })
    ]);
    assert.equal(firstHostActionRes.ok, true);
    assert.equal(relayedHostAction.actions[0].moveName, "tackle");

    const duplicateHostActionRes = await request(host, "battle:team-actions", {
        roomCode,
        turn: 1,
        teamIndex: 0,
        actions: [hostActionPayload]
    });
    assert.equal(duplicateHostActionRes.ok, false);

    const guestActionPayload = makeAction({ teamIndex: 1, targetTeamIndex: 0 });
    const [relayedGuestAction, guestActionRes] = await Promise.all([
        once(host, "battle:team-actions"),
        request(guest, "battle:team-actions", {
            roomCode,
            turn: 1,
            teamIndex: 1,
            actions: [guestActionPayload]
        })
    ]);
    assert.equal(guestActionRes.ok, true);
    assert.equal(relayedGuestAction.teamIndex, 1);

    const [relayedState, stateRes] = await Promise.all([
        once(guest, "battle:state"),
        request(host, "battle:state", {
            roomCode,
            turn: 2,
            state: { teams: [[], []] }
        })
    ]);
    assert.equal(stateRes.ok, true);
    assert.equal(relayedState.state.teams.length, 2);
});