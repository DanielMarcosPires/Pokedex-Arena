// Mantemencao da batalha: parte 11 (Organizada e Limpa)

// Configura e vincula todos os ouvintes de eventos do socket para o gerenciamento de salas e partidas online
function bindOnlineSocket(socket) {
    // Tratamento de erros de conexão
    socket.on("connect_error", (error) => {
        console.error("Erro de conexão com a sala online:", error);
        setOnlineLobbyStatus("Não foi possível conectar ao servidor online.", true);
    });

    // Eventos de gerenciamento de entrada/saída de jogadores na sala
    socket.on("room:player-joined", () => {
        setOnlineLobbyStatus("Amigo conectado. Monte seu time e envie para a sala.");
    });

    socket.on("room:player-left", () => {
        setOnlineLobbyStatus("Seu adversário saiu da sala.", true);
        if (onlineBattleStarted) {
            onlineWaitingForState = true;
            renderActionPanel();
        }
    });

    socket.on("room:closed", ({ message }) => {
        setOnlineLobbyStatus(message || "A sala foi encerrada.", true);
        
        if (pendingForcedSwitchResolution) {
            const resolve = pendingForcedSwitchResolution;
            pendingForcedSwitchResolution = null;
            resolve(false);
        }
        
        resetOnlineSession();
    });

    socket.on("room:format-updated", ({ format }) => {
        console.log("[DBG][guest] room:format-updated recebeu:", format);
        if (typeof applySyncedBattleFormat === "function") {
            applySyncedBattleFormat(format);
        }
    });

    // Sincronização de equipes prontas e início da partida
    socket.on("room:teams-ready", (payload) => {
        console.log("[DBG][guest] room:teams-ready payload.format:", payload?.format);
        if (typeof applySyncedBattleFormat === "function" && payload?.format) {
            applySyncedBattleFormat(payload.format);
        }
        loadOnlineTeams(payload).catch((error) => {
            console.error("Erro ao preparar os times online:", error);
            setOnlineLobbyStatus("Não foi possível carregar os times da sala.", true);
            onlineTeamsLoading = false;
        });
    });

    socket.on("battle:ready", () => {
        onlineBattleReady = true;
        onlineWaitingForState = false;
        onlineLobbyStatus.textContent = "";
        renderBattle();
    });

    // Eventos de ações, turnos e estados da batalha
    socket.on("battle:team-actions", (payload) => {
        handleOnlineTeamActions(payload).catch((error) => {
            console.error("Ação online inválida:", error);
            setOnlineLobbyStatus("Não foi possível sincronizar a ação do adversário.", true);
        });
    });

    socket.on("battle:state", (payload) => {
        if (onlineRole !== 1 || !onlineBattleStarted) return;
        
        try {
            onlineWaitingForState = false;
            onlineForcedSwitchPending = false;
            applyOnlineGameState(payload.state);
        } catch (error) {
            console.error("Estado online inválido:", error);
            setOnlineLobbyStatus("Não foi possível sincronizar o estado da batalha.", true);
        }
    });

    socket.on("battle:visual-state", (payload) => {
        if (onlineRole !== 1 || !onlineBattleStarted || !onlineBattleReady) return;
        
        try {
            applyOnlineGameState(payload.state, true);
        } catch (error) {
            console.error("Efeito online inválido:", error);
            setOnlineLobbyStatus("Não foi possível sincronizar o efeito da batalha.", true);
        }
    });

    // Eventos de trocas forçadas remotas (ex: Roar, U-turn)
    socket.on("battle:forced-switch", (payload) => {
        if (onlineRole !== 0 || !onlineBattleStarted) return;
        
        try {
            applyRemoteForcedSwitch(payload);
        } catch (error) {
            console.error("Troca online inválida:", error);
            setOnlineLobbyStatus("Não foi possível sincronizar a troca do adversário.", true);
        }
    });

    socket.on("battle:forced-switch-request", (payload) => {
        if (onlineRole !== 1 || !onlineBattleStarted ||
            !Number.isInteger(payload?.activeSlot) || payload.activeSlot < 0 ||
            payload.activeSlot >= game.format) return;
            
        openSwitchPicker(1, payload.activeSlot, true, payload.moveName || "");
    });
}