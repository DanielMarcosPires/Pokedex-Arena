const assert = require("node:assert/strict");
const { test } = require("node:test");
const { io: connect } = require("socket.io-client");
const { createGameServer, generateRoomCode, normalizeTeam, validActionList } = require("./server");

function makeTeam(offset = 0) {
    return {
        name: "Jogador",
        slots: Array.from({ length: 6 }, (_, index) => ({
            pokemonId: offset + index + 1,
            heldItem: null,
            moveNames: ["tackle", "growl", "quick-attack", "protect"]
        }))
    };
}

function once(socket, eventName) {
    return new Promise((resolve) => socket.once(eventName, resolve));
}

function request(socket, eventName, payload) {
    return new Promise((resolve) => socket.emit(eventName, payload, resolve));
}

test("validates room codes, teams, and action payloads", () => {
    assert.match(generateRoomCode(), /^[A-Z0-9]{6}$/);
    assert.equal(normalizeTeam(makeTeam()).slots.length, 6);
    assert.equal(normalizeTeam({ ...makeTeam(), slots: makeTeam().slots.slice(0, 5) }), null);
    const duplicateTeam = makeTeam();
    duplicateTeam.slots[5].pokemonId = duplicateTeam.slots[0].pokemonId;
    assert.equal(normalizeTeam(duplicateTeam), null);
    assert.equal(validActionList([{
        teamIndex: 0,
        activeSlot: 0,
        attackerIndex: 0,
        moveName: "tackle",
        targetTeamIndex: 1,
        targetActiveSlot: 0,
        targetUnavailable: false,
        megaEvolve: false,
        switchToIndex: null
    }], 0, 1), true);
    assert.equal(validActionList([{ ...makeTeam().slots[0], teamIndex: 0 }], 0, 1), false);
});

test("creates a room, synchronizes teams and relays turn actions", async (context) => {
    const gameServer = createGameServer();
    await new Promise((resolve) => gameServer.server.listen(0, "127.0.0.1", resolve));
    const address = gameServer.server.address();
    const url = `http://127.0.0.1:${address.port}`;
    const clients = [];
    context.after(async () => {
        clients.forEach((client) => client.disconnect());
        await new Promise((resolve) => gameServer.io.close(resolve));
    });

    const openClient = async () => {
        const client = connect(url, { transports: ["websocket"], reconnection: false });
        clients.push(client);
        await once(client, "connect");
        return client;
    };
    const host = await openClient();
    const guest = await openClient();
    const created = await request(host, "room:create", {});
    assert.equal(created.ok, true);
    const joined = await request(guest, "room:join", { roomCode: created.roomCode });
    assert.equal(joined.ok, true);
    assert.equal((await request(await openClient(), "room:join", { roomCode: created.roomCode })).ok, false);

    const hostTeams = once(host, "room:teams-ready");
    const guestTeams = once(guest, "room:teams-ready");
    assert.equal((await request(host, "room:submit-team", {
        roomCode: created.roomCode,
        team: makeTeam()
    })).ok, true);
    assert.equal((await request(guest, "room:submit-team", {
        roomCode: created.roomCode,
        team: makeTeam(20)
    })).ok, true);
    assert.equal((await hostTeams).teams.length, 2);
    assert.equal((await guestTeams).teams.length, 2);

    const hostBattleReady = once(host, "battle:ready");
    const guestBattleReady = once(guest, "battle:ready");
    await request(host, "battle:ready", { roomCode: created.roomCode });
    await request(guest, "battle:ready", { roomCode: created.roomCode });
    await Promise.all([hostBattleReady, guestBattleReady]);

    const action = {
        teamIndex: 0,
        activeSlot: 0,
        attackerIndex: 0,
        moveName: "tackle",
        targetTeamIndex: 1,
        targetActiveSlot: 0,
        targetUnavailable: false,
        megaEvolve: false,
        switchToIndex: null
    };
    const hostAction = once(guest, "battle:team-actions");
    assert.equal((await request(host, "battle:team-actions", {
        roomCode: created.roomCode,
        turn: 1,
        teamIndex: 0,
        actions: [action]
    })).ok, true);
    assert.equal((await hostAction).actions[0].moveName, "tackle");
    assert.equal((await request(host, "battle:team-actions", {
        roomCode: created.roomCode,
        turn: 1,
        teamIndex: 0,
        actions: [action]
    })).ok, false);

    const guestAction = once(host, "battle:team-actions");
    assert.equal((await request(guest, "battle:team-actions", {
        roomCode: created.roomCode,
        turn: 1,
        teamIndex: 1,
        actions: [{ ...action, teamIndex: 1, targetTeamIndex: 0 }]
    })).ok, true);
    assert.equal((await guestAction).teamIndex, 1);

    const nextState = once(guest, "battle:state");
    assert.equal((await request(host, "battle:state", {
        roomCode: created.roomCode,
        turn: 2,
        state: { teams: [[], []] }
    })).ok, true);
    assert.equal((await nextState).state.teams.length, 2);
});
