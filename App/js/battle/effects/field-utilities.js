// Mantemencao da batalha: parte 104 a 106 (Organizadas e Limpas)

// 1. Reseta e limpa todas as armadilhas (Entry Hazards) de um determinado time em campo
function clearHazards(teamIndex) {
    game.fieldEffects.hazards[teamIndex] = {
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
        stickyWeb: false
    };
}


// 2. Aplica efeitos utilitários globais de campo causados por golpes especiais (Defog, Court Change, Tidy Up)
function applyFieldUtilityMove(action, move) {
    const { fieldEffects } = game;
    const attackerName = plainName(game.teams[action.teamIndex].members[action.attackerIndex].entry.name);

    // Defog: remove hazards e telas de proteção de ambos os lados e reduz a esquiva do alvo
    if (move.name === "defog") {
        [0, 1].forEach((teamIndex) => {
            clearHazards(teamIndex);
            Object.keys(fieldEffects.screens).forEach((screen) => {
                fieldEffects.screens[screen][teamIndex] = 0;
            });
            fieldEffects.safeguardTurns[teamIndex] = 0;
            fieldEffects.mistTurns[teamIndex] = 0;
        });

        const target = getMoveTargets(action)[0];
        if (target) {
            applyStatChanges(target.member, move, action.teamIndex);
        }

        game.log.push(`${attackerName} dissipou as armadilhas e barreiras com Defog.`);
        return true;
    }

    // Court Change: troca os efeitos de campo (hazards, telas, safeguard, etc.) entre os dois times
    if (move.name === "court-change") {
        ["hazards", "safeguardTurns", "mistTurns", "luckyChantTurns"].forEach((key) => {
            [fieldEffects[key][0], fieldEffects[key][1]] = [fieldEffects[key][1], fieldEffects[key][0]];
        });

        Object.keys(fieldEffects.screens).forEach((screen) => {
            [fieldEffects.screens[screen][0], fieldEffects.screens[screen][1]] = [
                fieldEffects.screens[screen][1],
                fieldEffects.screens[screen][0]
            ];
        });

        game.log.push(`${attackerName} trocou os efeitos de campo dos dois lados com Court Change.`);
        return true;
    }

    // Tidy Up: limpa hazards de ambos os lados, remove Substitutos e aumenta Atributos/Velocidade do usuário
    if (move.name === "tidy-up") {
        [0, 1].forEach(clearHazards);

        game.teams.forEach((team) => 
            team.members.forEach((member) => {
                if (member.moveEffects?.substituteHp) {
                    member.moveEffects.substituteHp = 0;
                }
            })
        );

        applyStatChanges(game.teams[action.teamIndex].members[action.attackerIndex], move, action.teamIndex);
        game.log.push(`${attackerName} limpou o campo com Tidy Up.`);
        return true;
    }

    return false;
}


// 3. Determina os alvos válidos de um golpe com base no tipo de mira (target) e slots ativos em campo
function getMoveTargets(action) {
    const targetName = action.move.target?.name;
    const opponentTeam = 1 - action.teamIndex;

    const getActiveTargets = (teamIndex, excluded = []) => 
        game.active[teamIndex]
            .map((memberIndex, activeSlot) => ({ teamIndex, activeSlot, memberIndex }))
            .filter(({ activeSlot, memberIndex }) => {
                if (excluded.some((target) => target.teamIndex === teamIndex && target.activeSlot === activeSlot)) {
                    return false;
                }
                return memberIndex !== null && game.teams[teamIndex].members[memberIndex].currentHp > 0;
            })
            .map((target) => ({ ...target, member: game.teams[teamIndex].members[target.memberIndex] }));

    const selectedTeam = action.targetTeamIndex ?? 
        (["user", "user-or-ally", "ally"].includes(targetName) ? action.teamIndex : opponentTeam);
    
    const selectedSlot = action.targetActiveSlot ?? 
        (selectedTeam === action.teamIndex ? action.activeSlot : 0);

    // Alvo: Próprio usuário
    if (targetName === "user") {
        const memberIndex = game.active[action.teamIndex][action.activeSlot];
        return memberIndex === null ? [] : [{
            teamIndex: action.teamIndex,
            activeSlot: action.activeSlot,
            memberIndex,
            member: game.teams[action.teamIndex].members[memberIndex]
        }];
    }

    // Alvo: Todos os oponentes
    if (targetName === "all-opponents") {
        return getActiveTargets(opponentTeam);
    }

    // Alvo: Todos os outros Pokémon em campo (exceto o usuário)
    if (targetName === "all-other-pokemon") {
        const user = { teamIndex: action.teamIndex, activeSlot: action.activeSlot };
        return [...getActiveTargets(0, [user]), ...getActiveTargets(1, [user])];
    }

    // Alvo: Todos os Pokémon em campo
    if (targetName === "all-pokemon") {
        return [...getActiveTargets(0), ...getActiveTargets(1)];
    }

    // Alvo: Oponente aleatório
    if (targetName === "random-opponent") {
        const targets = getActiveTargets(opponentTeam);
        return targets.length ? [targets[Math.floor(Math.random() * targets.length)]] : [];
    }

    // Alvo: Campo (sem alvos individuais específicos)
    if (targetName === "opponents-field" || targetName === "users-field" || targetName === "entire-field") {
        return [];
    }

    // Alvo padrão: Pokémon específico selecionado no slot do time alvo
    const memberIndex = game.active[selectedTeam][selectedSlot];
    if (memberIndex === null) return [];

    const member = game.teams[selectedTeam].members[memberIndex];
    return member.currentHp > 0
        ? [{ teamIndex: selectedTeam, activeSlot: selectedSlot, memberIndex, member }]
        : [];
}