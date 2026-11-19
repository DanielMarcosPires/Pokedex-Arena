// Mantemencao da batalha: parte 78 a 81 (Organizadas e Limpas)

// 1. Renderiza o painel de espera informando o status atual da partida online
function renderOnlineWaiting(message) {
    positionTurnControls(Number.isInteger(onlineRole) ? onlineRole : game.currentPlayer);
    
    turnControls.innerHTML = `
        <section class="turn-action-panel online-waiting-panel">
            <h3>Partida online</h3>
            <p role="status" aria-live="polite">${escapeHTML(message)}</p>
        </section>
    `;
}


// 2. Serializa as ações pendentes do turno em um payload leve para transmissão via rede
function serializeOnlineActions(actions) {
    return actions.map((action) => ({
        teamIndex: action.teamIndex,
        activeSlot: action.activeSlot,
        attackerIndex: action.attackerIndex,
        moveName: action.move?.name || null,
        targetTeamIndex: Number.isInteger(action.targetTeamIndex) ? action.targetTeamIndex : null,
        targetActiveSlot: Number.isInteger(action.targetActiveSlot) ? action.targetActiveSlot : null,
        targetUnavailable: Boolean(action.targetUnavailable),
        megaEvolve: Boolean(action.megaEvolve),
        switchToIndex: Number.isInteger(action.switchToIndex) ? action.switchToIndex : null
    }));
}


// 3. Recebe, valida e hidrata as ações enviadas pelo adversário remoto convertendo-as para objetos de execução interna
function hydrateOnlineActions(teamIndex, payload) {
    if (!Array.isArray(payload) || payload.length !== getActiveActors(teamIndex).length) {
        throw new Error("Quantidade de ações incompatível com o formato da batalha.");
    }

    return payload.map((action) => {
        const activeSlot = Number(action.activeSlot);
        const attackerIndex = Number(action.attackerIndex);

        if (action.teamIndex !== teamIndex ||
            !Number.isInteger(activeSlot) || activeSlot < 0 || activeSlot >= game.format ||
            game.active[teamIndex][activeSlot] !== attackerIndex) {
            throw new Error("O jogador enviou uma ação para um Pokémon inválido.");
        }

        const member = game.teams[teamIndex].members[attackerIndex];
        const move = action.moveName
            ? member.moves.find((candidate) => candidate.name === action.moveName)
            : null;

        const switchToIndex = Number.isInteger(action.switchToIndex) ? action.switchToIndex : null;

        if ((!move && switchToIndex === null) ||
            (switchToIndex !== null && !getAvailableSwitches(teamIndex).some(({ index }) => index === switchToIndex))) {
            throw new Error("O jogador enviou uma ação ou troca inválida.");
        }

        [action.targetTeamIndex, action.targetActiveSlot].forEach((value) => {
            if (value !== null && (!Number.isInteger(value) || value < 0 || value > 1)) {
                throw new Error("O jogador enviou um alvo inválido.");
            }
        });

        return {
            teamIndex,
            activeSlot,
            attackerIndex,
            move,
            targetTeamIndex: action.targetTeamIndex,
            targetActiveSlot: action.targetActiveSlot,
            targetUnavailable: Boolean(action.targetUnavailable),
            megaEvolve: Boolean(action.megaEvolve),
            ...(switchToIndex !== null ? { switchToIndex } : {})
        };
    });
}


// 4. Envia as ações escolhidas pelo jogador local para o servidor no modo online
function sendOnlineTeamActions(teamIndex) {
    if (!onlineSocket?.connected) {
        onlineWaitingForState = false;
        setOnlineLobbyStatus("A conexão com a sala foi perdida.", true);
        renderActionPanel();
        return;
    }

    onlineSocket.emit("battle:team-actions", {
        roomCode: onlineRoomCode,
        turn: game.turn,
        teamIndex,
        actions: serializeOnlineActions(game.pendingActions[teamIndex])
    }, (response) => {
        if (response?.ok) return;
        
        onlineWaitingForState = false;
        setOnlineLobbyStatus(response?.error || "Não foi possível enviar as ações.", true);
        renderActionPanel();
    });
}