// Mantemencao da batalha: parte 67 a 71 (Organizadas e Limpas)

// 1. Posiciona os controles de turno dinamicamente de acordo com a responsabilidade do jogador e resolução de tela
function positionTurnControls(teamIndex = game.currentPlayer) {
    const playerSide = battlefield.querySelector(`.arena-team-${teamIndex + 1}`);
    
    battlefield.querySelectorAll(".arena-side").forEach((side) => {
        side.classList.toggle("is-turn", side === playerSide);
    });

    if (window.matchMedia("(max-width: 650px)").matches) {
        if (battlefield.nextElementSibling !== turnControls) {
            battlefield.after(turnControls);
        }
    } else if (playerSide && turnControls.parentElement !== playerSide) {
        playerSide.append(turnControls);
    }
}


// 2. Retorna a lista de combatentes ativos e aptos para lutar em um determinado time
function getActiveActors(teamIndex) {
    return game.active[teamIndex]
        .map((memberIndex, activeSlot) => ({
            memberIndex,
            activeSlot,
            member: memberIndex === null ? null : game.teams[teamIndex].members[memberIndex]
        }))
        .filter(({ member }) => member && member.currentHp > 0);
}


// 3. Retorna os Pokémon do banco que estão disponíveis para entrar em campo (vivos, não ativos e sem troca pendente)
function getAvailableSwitches(teamIndex) {
    const activeIndices = new Set(game.active[teamIndex].filter((index) => index !== null));
    const selectedSwitches = new Set((game.pendingActions[teamIndex] || [])
        .map(({ switchToIndex }) => switchToIndex)
        .filter(Number.isInteger));

    return game.teams[teamIndex].members
        .map((member, index) => ({ member, index }))
        .filter(({ member, index }) => 
            member.currentHp > 0 &&
            !activeIndices.has(index) &&
            !selectedSwitches.has(index)
        );
}


// 4. Verifica se um Pokémon pode realizar uma troca voluntária (sem estar preso por armadilhas como Bind, Ingrain, etc.)
function canVoluntarilySwitch(member) {
    const effects = member.moveEffects || {};
    return !(effects.bindTurns > 0 || effects.permanentTrap || effects.ingrain);
}


// 5. Verifica se há necessidade de substituir algum Pokémon que desmaiou e possui reservas disponíveis
function getRequiredReplacement() {
    const teamOrder = onlineMode && Number.isInteger(onlineRole)
        ? [onlineRole, 1 - onlineRole]
        : [0, 1];

    for (const teamIndex of teamOrder) {
        const activeSlot = game.active[teamIndex].findIndex((memberIndex) => memberIndex === null);
        
        if (activeSlot !== -1 && getAvailableSwitches(teamIndex).length > 0) {
            return { teamIndex, activeSlot };
        }
    }

    return null;
}