// Mantemencao da batalha: parte 73 e 74 (Organizadas e Limpas)

// 1. Processa a escolha do Pokémon reserva (tanto para trocas forçadas por golpes quanto para trocas voluntárias/turnos)
function chooseSwitchPokemon(switchToIndex) {
    if (!switchTarget) return;
    const { teamIndex, activeSlot, forced, moveName, onChosen } = switchTarget;

    // A. Tratamento para Trocas Forçadas (por golpes como Roar, U-turn, Baton Pass, etc.)
    if (forced) {
        if (onlineMode && teamIndex !== onlineRole) return;
        
        // Envio da troca forçada para o servidor no modo online (se for o cliente convidado)
        if (onlineMode && onlineRole === 1) {
            switchDialog.close();
            onlineForcedSwitchPending = true;
            onlineWaitingForState = true;
            renderActionPanel();
            
            onlineSocket.emit("battle:forced-switch", {
                roomCode: onlineRoomCode,
                activeSlot,
                switchToIndex,
                moveName
            }, (response) => {
                if (response?.ok) return;
                onlineForcedSwitchPending = false;
                onlineWaitingForState = false;
                setOnlineLobbyStatus(response?.error || "Não foi possível enviar a troca.", true);
                renderActionPanel();
            });
            return;
        }

        const team = game.teams[teamIndex];
        const outgoingIndex = game.active[teamIndex][activeSlot];
        const outgoing = team.members[outgoingIndex];
        const incoming = team.members[switchToIndex];

        if (outgoing) {
            // Específico do Baton Pass: transfere bônus de status e confusão
            if (moveName === "baton-pass") {
                incoming.statStages = { ...outgoing.statStages };
                incoming.confusionTurns = outgoing.confusionTurns;
            } else {
                outgoing.statStages = {};
            }
            
            // Limpeza de efeitos e reset de status do Pokémon que está saindo
            outgoing.confusionTurns = 0;
            outgoing.moveEffects = {};
            setMemberTypeNames(outgoing, memberResetTypes(outgoing));
            outgoing.moves = [...outgoing.originalMoves];
            outgoing.transformedStats = null;
            outgoing.protectionChain = 0;
            outgoing.criticalStage = 0;
        }

        switchDialog.close();
        game.active[teamIndex][activeSlot] = switchToIndex;
        incoming.entryTurn = game.turn;

        game.log.push(moveName && outgoing
            ? `${plainName(outgoing.entry.name)} saiu após ${formatName(moveName)}; ${plainName(incoming.entry.name)} entrou.`
            : `${teamDisplayName(teamIndex)} enviou ${plainName(incoming.entry.name)} para a batalha.`
        );

        applyEntryHazards(teamIndex, switchToIndex);

        if (onChosen) {
            onChosen();
            return;
        }

        renderBattle();
        if (onlineMode && onlineRole === 0) sendOnlineBattleState();
        return;
    }

    // B. Tratamento para Trocas Voluntárias (escolhida pelo jogador no seu turno)
    const attackerIndex = game.active[teamIndex][activeSlot];
    switchDialog.close();

    const currentMember = game.teams[teamIndex].members[attackerIndex];
    currentMember.statStages = {};
    currentMember.moveEffects = {};
    setMemberTypeNames(currentMember, memberResetTypes(currentMember));
    currentMember.moves = [...currentMember.originalMoves];
    currentMember.transformedStats = null;
    currentMember.protectionChain = 0;
    currentMember.criticalStage = 0;

    registerAction({ teamIndex, activeSlot, attackerIndex, switchToIndex });
}


// 2. Valida se um determinado lado/time pode ser escolhido como alvo de uma ação/golpe
function canSelectBattleTarget(action, teamIndex) {
    const targetName = action.move.target?.name;

    if (action.move.name === "after-you") return teamIndex === action.teamIndex;
    if (["user-or-ally", "ally"].includes(targetName)) return teamIndex === action.teamIndex;
    if (targetName !== "selected-pokemon") return teamIndex !== action.teamIndex;
    
    // Casos especiais de golpes que podem atingir aliados ou ambos os lados
    if (action.move.name === "pollen-puff") return true;
    if (action.move.meta?.category?.name === "heal") return teamIndex === action.teamIndex;
    if (["swagger", "flatter", "psych-up"].includes(action.move.name)) return true;

    return teamIndex !== action.teamIndex;
}