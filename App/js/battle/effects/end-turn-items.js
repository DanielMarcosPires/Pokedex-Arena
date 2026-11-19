// Mantemencao da batalha: parte 128 e 129 (Organizadas e Limpas)

// 1. Processa os efeitos e ativações de itens segurados (Held Items) ao final de cada turno de batalha
function applyHeldItemEndTurn(teamIndex, memberIndex) {
    const member = game.teams[teamIndex].members[memberIndex];
    if (member.currentHp <= 0 || !member.heldItem) return;

    const name = plainName(member.entry.name);

    // Aplicação de condições de status por Orbs (Flame Orb / Toxic Orb)
    if (member.heldItem === "flame_orb" && !member.status && !getMemberTypeNames(member).includes("fire")) {
        member.status = { name: "burn", turnsRemaining: 0, toxicStage: 0 };
        game.log.push(`${name} foi queimado pelo Flame Orb.`);
        recordItemEffect(teamIndex, memberIndex, "status", "Flame Orb · queimado");
    } else if (member.heldItem === "toxic_orb" && !member.status &&
        !getMemberTypeNames(member).some((type) => ["poison", "steel"].includes(type))) {
        member.status = { name: "toxic", turnsRemaining: 0, toxicStage: 1 };
        game.log.push(`${name} foi gravemente envenenado pelo Toxic Orb.`);
        recordItemEffect(teamIndex, memberIndex, "status", "Toxic Orb · envenenado");
    }

    // Consumo preventivo de bagas de cura por status (Lum Berry)
    consumeLumBerry(member);
    if (member.currentHp <= 0) return;

    // Consumo de bagas de HP (Sitrus Berry / Oran Berry) quando o HP cai para 50% ou menos
    if (member.currentHp <= member.maxHp / 2 && ["sitrus_berry", "oran_berry"].includes(member.heldItem)) {
        const amount = member.heldItem === "sitrus_berry" ? member.maxHp / 4 : 10;
        const berry = member.heldItem === "sitrus_berry" ? "Sitrus Berry" : "Oran Berry";
        const healed = healWithHeldItem(teamIndex, memberIndex, amount, berry);
        
        member.heldItem = null;
        if (healed) {
            game.log.push(`${name} consumiu ${berry} e recuperou ${healed} HP.`);
        }
    }

    // Leftovers (Cura contínua de 1/16 do HP máximo)
    if (member.currentHp > 0 && member.heldItem === "leftovers") {
        const healed = healWithHeldItem(teamIndex, memberIndex, member.maxHp / 16, "Leftovers");
        if (healed) {
            game.log.push(`${name} recuperou ${healed} HP com Leftovers.`);
        }
    }

    // Black Sludge (Cura para Pokémon do tipo Poison ou dano para os demais)
    if (member.currentHp > 0 && member.heldItem === "black_sludge") {
        if (getMemberTypeNames(member).includes("poison")) {
            const healed = healWithHeldItem(teamIndex, memberIndex, member.maxHp / 16, "Black Sludge");
            if (healed) {
                game.log.push(`${name} recuperou ${healed} HP com Black Sludge.`);
            }
        } else {
            const damage = Math.max(1, Math.floor(member.maxHp / 8));
            recordDamage(teamIndex, memberIndex, damage);
            game.log.push(`${name} sofreu ${damage} de dano por Black Sludge.`);
            recordItemEffect(teamIndex, memberIndex, "damage", `Black Sludge · -${damage} HP`);
        }
    }
}


// 2. Decrementa os contadores de turnos de todos os efeitos globais de campo (clima, terrenos, telas, Trick Room, etc.)
function decrementFieldEffects() {
    const { fieldEffects } = game;

    // Trick Room
    if (fieldEffects.trickRoomTurns > 0) {
        fieldEffects.trickRoomTurns--;
        if (fieldEffects.trickRoomTurns === 0) {
            game.log.push("O efeito de Trick Room acabou.");
        }
    }

    // Tailwind por time
    fieldEffects.tailwindTurns = fieldEffects.tailwindTurns.map((turns, teamIndex) => {
        if (turns <= 0) return 0;
        const remaining = turns - 1;
        if (remaining === 0) {
            game.log.push(`O Tailwind de ${teamDisplayName(teamIndex)} acabou.`);
        }
        return remaining;
    });

    // Clima e Terrenos
    ["weather", "terrain"].forEach((key) => {
        const effect = fieldEffects[key];
        if (effect.turns <= 0) return;
        
        effect.turns--;
        if (effect.turns === 0) {
            game.log.push(`O efeito de ${key === "weather" ? "clima" : "terreno"} acabou.`);
            effect.name = null;
        }
    });

    // Telas de Proteção (Screens)
    ["reflect", "lightScreen", "auroraVeil"].forEach((screen) => {
        fieldEffects.screens[screen] = fieldEffects.screens[screen].map((turns) => Math.max(0, turns - 1));
    });

    // Proteções de equipe (Safeguard, Mist, Lucky Chant)
    ["safeguardTurns", "mistTurns", "luckyChantTurns"].forEach((key) => {
        fieldEffects[key] = fieldEffects[key].map((turns) => Math.max(0, turns - 1));
    });

    // Efeitos globais utilitários de campo
    ["gravityTurns", "wonderRoomTurns", "magicRoomTurns", "mudSportTurns", "waterSportTurns"].forEach((key) => {
        fieldEffects[key] = Math.max(0, fieldEffects[key] - 1);
    });

    // Eventos de turno único (Fairy Lock e Ion Deluge)
    if (fieldEffects.fairyLockTurn === game.turn) fieldEffects.fairyLockTurn = null;
    if (fieldEffects.ionDelugeTurn === game.turn) fieldEffects.ionDelugeTurn = null;
}