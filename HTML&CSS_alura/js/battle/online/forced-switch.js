// Manutenção da batalha: partes 88 a 90 (Organizadas e Limpas)

function canMemberAct(member) {
    if (!member) return false;
    // Se o Pokémon estiver sem HP (desmaiado), não pode agir
    if (typeof member.hp === 'number' && member.hp <= 0) return false;
    return true;
}

// 1. Aplica uma troca forçada recebida do adversário no modo online (ex: após Roar, U-turn, etc.)
function applyRemoteForcedSwitch(payload) {
    const teamIndex = 1;
    const { activeSlot, switchToIndex } = payload;
    
    if (!game || !game.teams || !game.active) {
        throw new Error("O estado da batalha não foi inicializado.");
    }

    if (payload.roomCode !== onlineRoomCode ||
        !Number.isInteger(activeSlot) || activeSlot < 0 || activeSlot >= game.format ||
        !getAvailableSwitches(teamIndex).some(({ index }) => index === switchToIndex)) {
        throw new Error("A troca forçada recebida não é válida.");
    }

    const outgoingIndex = game.active[teamIndex][activeSlot];
    const outgoing = (outgoingIndex === null || outgoingIndex === undefined) 
        ? null 
        : game.teams[teamIndex]?.members[outgoingIndex];

    const hasMove = Boolean(payload.moveName);
    const hasOutgoing = Boolean(outgoing);
    
    if ((hasMove && !hasOutgoing) || (!hasMove && hasOutgoing)) {
        throw new Error("A troca não corresponde ao estado atual do Pokémon.");
    }

    const incoming = game.teams[teamIndex]?.members[switchToIndex];
    if (!incoming) {
        throw new Error("O Pokémon entrante não foi encontrado.");
    }

    // Reseta os status e modificadores do Pokémon que está saindo de campo
    if (outgoing) {
        outgoing.statStages = {};
        outgoing.confusionTurns = 0;
        outgoing.moveEffects = {};
        setMemberTypeNames(outgoing, memberResetTypes(outgoing));
        outgoing.moves = [...outgoing.originalMoves];
        outgoing.transformedStats = null;
        outgoing.protectionChain = 0;
        outgoing.criticalStage = 0;
    }

    game.active[teamIndex][activeSlot] = switchToIndex;
    incoming.entryTurn = game.turn;

    // Adiciona a mensagem correspondente ao log de batalha
    game.log.push(outgoing
        ? `${plainName(outgoing.entry.name)} saiu após ${formatName(payload.moveName)}; ${plainName(incoming.entry.name)} entrou.`
        : `${teamDisplayName(teamIndex)} enviou ${plainName(incoming.entry.name)} para a batalha.`
    );

    applyEntryHazards(teamIndex, switchToIndex);

    if (pendingForcedSwitchResolution) {
        const resolve = pendingForcedSwitchResolution;
        pendingForcedSwitchResolution = null;
        resolve(true);
        return;
    }

    renderBattle();
    sendOnlineBattleState();
}


// 2. Registra a ação escolhida por um jogador (golpe, item ou troca) e gerencia a alternância de turnos ou resolução
function registerAction(action) {
    const actions = game.pendingActions[action.teamIndex];
    if (actions.some(({ activeSlot }) => activeSlot === action.activeSlot)) return;

    if (soundEffectsEnabled) {
        getAudioContext();
    }

    game.pendingMega.delete(`${action.teamIndex}:${action.activeSlot}`);
    actions.push(action);

    const totalActiveActors = getActiveActors(action.teamIndex).length;

    // 1. Se este time ainda tem Pokémon ativos que precisam escolher ação neste turno:
    if (actions.length < totalActiveActors) {
        renderActionPanel();
        return;
    }

    // 2. Se estamos no modo online:
    if (onlineMode) {
        if (action.teamIndex !== onlineRole) return;
        
        if (onlineRole === 0) {
            game.currentPlayer = 1;
        } else {
            onlineWaitingForState = true;
        }
        
        sendOnlineTeamActions(action.teamIndex);
        renderActionPanel();
        return;
    }

    // 3. Modo Local (Offline / Hotseat):
    // Se o Jogador 0 terminou todos os seus Pokémon ativos, passa a vez para o Jogador 1
    if (action.teamIndex === 0 && game.pendingActions[1].length < getActiveActors(1).length) {
        game.currentPlayer = 1;
        renderActionPanel();
        return;
    }

    // Se ambos os times já completaram as ações de todos os seus Pokémon ativos:
    if (game.pendingActions[0].length >= getActiveActors(0).length && 
        game.pendingActions[1].length >= getActiveActors(1).length) {
        
        resolveTurn().catch((error) => {
            console.error("Erro ao resolver o turno:", error);
            game.log.push("Não foi possível concluir o turno. Verifique o registro da batalha.");
            game.pendingActions = [[], []];
            game.pendingTarget = null;
            renderBattle();
        });
    } else {
        // Caso contrário, continua alternando para quem falta agir
        game.currentPlayer = action.teamIndex === 0 ? 1 : 0;
        renderActionPanel();
    }
}



// 3. Renderiza a interface completa da arena de batalha (efeitos, ordem, times, log e controles)
function renderBattle(isResolving = false) {
    battleTurn.textContent = `Turno ${game.turn}`;
    turnControls.hidden = isResolving;

    battlefield.innerHTML = `
        <div class="battle-arena">
            ${renderFieldEffects()}
            ${renderBattleOrder()}
            <div class="arena-matchup ${game.format === 2 ? "is-doubles" : ""}">
                ${renderBattleTeam(0)}
                ${renderBattleTeam(1)}
            </div>
        </div>
    `;

    renderBattleLog();

    if (isResolving) {
        positionTurnControls();
        battlefield.querySelectorAll(".arena-side").forEach((side) => side.classList.remove("is-turn"));
        return;
    }

    turnControls.hidden = false;
    renderActionPanel();
}