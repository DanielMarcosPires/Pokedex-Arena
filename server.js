const crypto = require("node:crypto");
const http = require("node:http");
const path = require("node:path");
const express = require("express");
const { Server } = require("socket.io");

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const SLUG_PATTERN = /^[a-z0-9_-]{1,80}$/;
const MAX_TEAM_SLOTS = 6;
const MAX_MOVES_PER_SLOT = 4;

function normalizeFormat(value, fallback = 1) {
    return value === 2 ? 2 : value === 1 ? 1 : fallback;
}

function generateRoomCode() {
    return Array.from({ length: ROOM_CODE_LENGTH }, () =>
        ROOM_CODE_ALPHABET[crypto.randomInt(ROOM_CODE_ALPHABET.length)]).join("");
}

function normalizeTeam(value) {
    if (!value || typeof value !== "object" || !Array.isArray(value.slots) || value.slots.length !== MAX_TEAM_SLOTS) {
        return null;
    }

    const ids = new Set();
    const slots = [];

    for (const slot of value.slots) {
        if (
            !slot ||
            !Number.isInteger(slot.pokemonId) ||
            slot.pokemonId < 1 ||
            ids.has(slot.pokemonId) ||
            !Array.isArray(slot.moveNames) ||
            slot.moveNames.length !== MAX_MOVES_PER_SLOT ||
            new Set(slot.moveNames).size !== MAX_MOVES_PER_SLOT ||
            !slot.moveNames.every((name) => typeof name === "string" && SLUG_PATTERN.test(name)) ||
            (
                slot.heldItem !== null &&
                slot.heldItem !== undefined &&
                (typeof slot.heldItem !== "string" || !SLUG_PATTERN.test(slot.heldItem))
            )
        ) {
            return null;
        }

        ids.add(slot.pokemonId);
        slots.push({
            pokemonId: slot.pokemonId,
            heldItem: slot.heldItem || null,
            moveNames: [...slot.moveNames]
        });
    }

    const name = typeof value.name === "string" ? value.name.trim().slice(0, 24) : "";
    return { name: name || "Jogador", slots };
}

function validActionList(actions, teamIndex, turn, battleFormat = 2) {
    const maxSlots = normalizeFormat(battleFormat, 2);

    if (
        !Array.isArray(actions) ||
        actions.length < 1 ||
        actions.length > maxSlots ||
        new Set(actions.map((action) => action?.activeSlot)).size !== actions.length
    ) {
        return false;
    }

    return actions.every((action) =>
        action &&
        action.teamIndex === teamIndex &&
        Number.isInteger(action.activeSlot) &&
        action.activeSlot >= 0 &&
        action.activeSlot < maxSlots &&
        Number.isInteger(action.attackerIndex) &&
        action.attackerIndex >= 0 &&
        action.attackerIndex < MAX_TEAM_SLOTS &&
        (action.moveName === null || (typeof action.moveName === "string" && SLUG_PATTERN.test(action.moveName))) &&
        (action.switchToIndex === null || (Number.isInteger(action.switchToIndex) && action.switchToIndex >= 0 && action.switchToIndex < MAX_TEAM_SLOTS)) &&
        (action.moveName || action.switchToIndex !== null) &&
        (action.targetTeamIndex === null || action.targetTeamIndex === 0 || action.targetTeamIndex === 1) &&
        (action.targetActiveSlot === null || (Number.isInteger(action.targetActiveSlot) && action.targetActiveSlot >= 0 && action.targetActiveSlot < maxSlots)) &&
        typeof action.targetUnavailable === "boolean" &&
        typeof action.megaEvolve === "boolean" &&
        Number.isInteger(turn)
    );
}

function createGameServer() {
    const app = express();
    app.disable("x-powered-by");
    app.use((_request, response, next) => {
        response.setHeader("X-Content-Type-Options", "nosniff");
        next();
    });
    app.use(express.static(path.join(__dirname, "App")));
    app.get("/health", (_request, response) => response.json({ status: "ok" }));

    const server = http.createServer(app);
    const io = new Server(server, { maxHttpBufferSize: 1e6 });
    const rooms = new Map();

    function socketRoom(socket) {
        const code = socket.data.roomCode;
        return code ? rooms.get(code) : null;
    }

    function respond(callback, response) {
        if (typeof callback === "function") callback(response);
    }

    function detachMember(room, socketId) {
        const member = io.sockets.sockets.get(socketId);
        if (member) {
            member.leave(room.code);
            delete member.data.roomCode;
            delete member.data.roomRole;
        }
    }

    function closeRoom(room, message, exceptSocketId = null) {
        const operator = io.to(room.code);
        if (exceptSocketId) operator.except(exceptSocketId);
        operator.emit("room:closed", { message });
        rooms.delete(room.code);

        [room.hostId, room.guestId].filter(Boolean).forEach((socketId) => {
            detachMember(room, socketId);
        });
    }

    function handleGuestExitBeforeBattle(room, guestSocket) {
        room.guestId = null;
        room.teams[1] = null;
        room.ready[1] = false;
        room.teamsSent = false;
        io.to(room.hostId).emit("room:player-left");
        if (guestSocket) {
            guestSocket.leave(room.code);
            delete guestSocket.data.roomCode;
            delete guestSocket.data.roomRole;
        }
    }

    function registerRoomEvents(socket) {
        socket.on("room:create", (payload, callback) => {
            if (socket.data.roomCode) {
                respond(callback, { ok: false, error: "Saia da sala atual antes de criar outra." });
                return;
            }

            let code;
            do {
                code = generateRoomCode();
            } while (rooms.has(code));

            const room = {
                code,
                hostId: socket.id,
                guestId: null,
                format: normalizeFormat(payload?.format, 1),
                teams: [null, null],
                teamsSent: false,
                ready: [false, false],
                battleStarted: false,
                actionsReceived: [false, false],
                turn: 1
            };

            rooms.set(code, room);
            socket.data.roomCode = code;
            socket.data.roomRole = 0;
            socket.join(code);

            respond(callback, { ok: true, roomCode: code, role: 0, format: room.format });
        });

        socket.on("room:set-format", (payload, callback) => {
            const room = socketRoom(socket);
            if (
                !room ||
                socket.data.roomRole !== 0 ||
                room.battleStarted ||
                payload?.roomCode !== room.code ||
                (payload?.format !== 1 && payload?.format !== 2)
            ) {
                respond(callback, { ok: false, error: "Não foi possível atualizar o formato da sala." });
                return;
            }

            room.format = payload.format;
            respond(callback, { ok: true, format: room.format });
            io.to(room.code).emit("room:format-updated", { format: room.format });
        });

        socket.on("room:join", (payload, callback) => {
            const code = typeof payload?.roomCode === "string" ? payload.roomCode.toUpperCase() : "";
            const room = rooms.get(code);

            if (!ROOM_CODE_PATTERN.test(code) || !room || room.battleStarted || room.guestId) {
                respond(callback, { ok: false, error: "Sala não encontrada, cheia ou já iniciada." });
                return;
            }

            if (socket.data.roomCode) {
                respond(callback, { ok: false, error: "Saia da sala atual antes de entrar em outra." });
                return;
            }

            room.guestId = socket.id;
            socket.data.roomCode = code;
            socket.data.roomRole = 1;
            socket.join(code);

            respond(callback, { ok: true, roomCode: code, role: 1, format: room.format });
            io.to(room.hostId).emit("room:player-joined", { format: room.format });

            if (room.teamsSent) {
                socket.emit("room:teams-ready", { teams: room.teams, format: room.format });
            }
        });

        socket.on("room:submit-team", (payload, callback) => {
            const room = socketRoom(socket);
            const role = socket.data.roomRole;
            const team = normalizeTeam(payload?.team);

            if (!room || payload?.roomCode !== room.code || room.battleStarted || !Number.isInteger(role) || !team) {
                respond(callback, { ok: false, error: "Não foi possível enviar o time. Confira a sala e os seis Pokémon." });
                return;
            }

            if (room.teams[role]) {
                respond(callback, { ok: false, error: "Seu time já foi enviado." });
                return;
            }

            room.teams[role] = team;
            respond(callback, { ok: true });

            if (room.teams.every(Boolean) && !room.teamsSent) {
                room.teamsSent = true;
                io.to(room.code).emit("room:teams-ready", { teams: room.teams, format: room.format });
            }
        });

        socket.on("room:leave", (payload, callback) => {
            const room = socketRoom(socket);
            if (!room || payload?.roomCode !== room.code) {
                respond(callback, { ok: false, error: "Você não está nessa sala." });
                return;
            }

            respond(callback, { ok: true });
            if (socket.data.roomRole === 1 && !room.battleStarted) {
                handleGuestExitBeforeBattle(room, socket);
                return;
            }

            closeRoom(room, "Seu adversário encerrou a sala.");
        });
    }

    function registerBattleEvents(socket) {
        socket.on("battle:ready", (payload, callback) => {
            const room = socketRoom(socket);
            const role = socket.data.roomRole;

            if (!room || payload?.roomCode !== room.code || !room.teamsSent || !Number.isInteger(role)) {
                respond(callback, { ok: false, error: "A sala ainda não está pronta para começar." });
                return;
            }

            room.ready[role] = true;
            respond(callback, { ok: true });

            if (room.ready.every(Boolean) && !room.battleStarted) {
                room.battleStarted = true;
                io.to(room.code).emit("battle:ready");
            }
        });

        socket.on("battle:team-actions", (payload, callback) => {
            const room = socketRoom(socket);
            const role = socket.data.roomRole;
            const teamIndex = payload?.teamIndex;

            if (
                !room ||
                !room.battleStarted ||
                payload?.roomCode !== room.code ||
                teamIndex !== role ||
                payload?.turn !== room.turn ||
                room.actionsReceived[role] ||
                !validActionList(payload.actions, role, payload.turn, room.format)
            ) {
                respond(callback, { ok: false, error: "Ação recusada: turno ou jogada inválidos." });
                return;
            }

            room.actionsReceived[role] = true;
            respond(callback, { ok: true });

            const opponentId = role === 0 ? room.guestId : room.hostId;
            io.to(opponentId).emit("battle:team-actions", {
                turn: room.turn,
                teamIndex: role,
                actions: payload.actions
            });
        });

        socket.on("battle:state", (payload, callback) => {
            const room = socketRoom(socket);
            const hasValidFormat = payload?.state?.format === undefined || payload.state.format === room?.format;

            if (
                !room ||
                socket.data.roomRole !== 0 ||
                !room.battleStarted ||
                payload?.roomCode !== room.code ||
                !Number.isInteger(payload.turn) ||
                payload.turn < room.turn ||
                payload.turn > room.turn + 1 ||
                !payload.state ||
                !Array.isArray(payload.state.teams) ||
                payload.state.teams.length !== 2 ||
                !hasValidFormat
            ) {
                respond(callback, { ok: false, error: "O estado da batalha foi recusado." });
                return;
            }

            if (payload.turn > room.turn) {
                room.turn = payload.turn;
                room.actionsReceived = [false, false];
            }

            respond(callback, { ok: true });
            io.to(room.guestId).emit("battle:state", { state: payload.state });
        });

        socket.on("battle:visual-state", (payload) => {
            const room = socketRoom(socket);
            if (
                !room ||
                socket.data.roomRole !== 0 ||
                !room.battleStarted ||
                payload?.roomCode !== room.code ||
                !payload.state ||
                !Array.isArray(payload.state.teams) ||
                payload.state.teams.length !== 2
            ) {
                return;
            }

            io.to(room.guestId).emit("battle:visual-state", { state: payload.state });
        });

        socket.on("battle:forced-switch-request", (payload, callback) => {
            const room = socketRoom(socket);
            const maxSlots = room ? room.format : 2;
            if (
                !room ||
                socket.data.roomRole !== 0 ||
                !room.battleStarted ||
                payload?.roomCode !== room.code ||
                payload.teamIndex !== 1 ||
                !Number.isInteger(payload.activeSlot) ||
                payload.activeSlot < 0 ||
                payload.activeSlot >= maxSlots ||
                typeof payload.moveName !== "string"
            ) {
                respond(callback, { ok: false, error: "Não foi possível solicitar a troca ao adversário." });
                return;
            }

            respond(callback, { ok: true });
            io.to(room.guestId).emit("battle:forced-switch-request", {
                activeSlot: payload.activeSlot,
                moveName: payload.moveName
            });
        });

        socket.on("battle:forced-switch", (payload, callback) => {
            const room = socketRoom(socket);
            const maxSlots = room ? room.format : 2;
            if (
                !room ||
                socket.data.roomRole !== 1 ||
                !room.battleStarted ||
                payload?.roomCode !== room.code ||
                !Number.isInteger(payload.activeSlot) ||
                payload.activeSlot < 0 ||
                payload.activeSlot >= maxSlots ||
                !Number.isInteger(payload.switchToIndex) ||
                payload.switchToIndex < 0 ||
                payload.switchToIndex >= MAX_TEAM_SLOTS
            ) {
                respond(callback, { ok: false, error: "A troca escolhida é inválida." });
                return;
            }

            respond(callback, { ok: true });
            io.to(room.hostId).emit("battle:forced-switch", {
                roomCode: room.code,
                activeSlot: payload.activeSlot,
                switchToIndex: payload.switchToIndex,
                moveName: payload.moveName || ""
            });
        });
    }

    io.on("connection", (socket) => {
        registerRoomEvents(socket);
        registerBattleEvents(socket);

        socket.on("disconnect", () => {
            const room = socketRoom(socket);
            if (!room) return;

            if (socket.data.roomRole === 0 || room.battleStarted) {
                closeRoom(room, "A conexão com o adversário foi encerrada.");
                return;
            }

            handleGuestExitBeforeBattle(room, socket);
        });
    });

    return { app, io, server, rooms };
}

if (require.main === module) {
    const { server } = createGameServer();
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, "0.0.0.0", () => {
        console.log(`Pokédex Arena disponível em http://localhost:${port}`);
    });
}

module.exports = { createGameServer, generateRoomCode, normalizeTeam, validActionList };