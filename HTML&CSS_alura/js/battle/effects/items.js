// Mantemencao da batalha: parte 110 a 113 (Organizadas e Limpas)

// 1. Aplica os efeitos de armadilhas em campo (Entry Hazards) quando um Pokémon entra em batalha
function applyEntryHazards(teamIndex, memberIndex) {
    const member = game.teams[teamIndex].members[memberIndex];
    const hazards = game.fieldEffects.hazards[teamIndex];

    // Heavy-Duty Boots protege o Pokémon contra todos os hazards em campo
    if (member.heldItem === "heavy_duty_boots") {
        if (hazards.stealthRock || hazards.spikes || hazards.toxicSpikes || hazards.stickyWeb) {
            recordItemEffect(teamIndex, memberIndex, "defense", "Heavy-Duty Boots · sem dano");
        }
        return;
    }

    if (member.currentHp <= 0) return;

    const types = getMemberTypeNames(member);
    const grounded = isGrounded(member);

    // Stealth Rock (causa dano baseado na eficácia do tipo Pedra)
    if (hazards.stealthRock) {
        const effectiveness = typeEffectiveness("rock", member);
        const damage = Math.max(1, Math.floor(member.maxHp * effectiveness / 8));
        const dealt = recordDamage(teamIndex, memberIndex, damage);
        game.log.push(`${plainName(member.entry.name)} sofreu ${dealt} de dano ao entrar por Stealth Rock.`);
    }

    if (member.currentHp <= 0) {
        game.log.push(`${plainName(member.entry.name)} foi derrotado pelas armadilhas.`);
        return;
    }

    // Spikes (causa dano proporcional ao HP máximo se o Pokémon estiver no chão)
    if (grounded && hazards.spikes > 0) {
        const fractions = [0, 1 / 8, 1 / 6, 1 / 4];
        const damage = Math.max(1, Math.floor(member.maxHp * fractions[hazards.spikes]));
        const dealt = recordDamage(teamIndex, memberIndex, damage);
        game.log.push(`${plainName(member.entry.name)} sofreu ${dealt} de dano ao entrar por Spikes.`);
    }

    if (member.currentHp <= 0) {
        game.log.push(`${plainName(member.entry.name)} foi derrotado pelas armadilhas.`);
        return;
    }

    // Toxic Spikes (envenena ou absorve se o Pokémon do tipo Venenoso estiver no chão)
    if (grounded && hazards.toxicSpikes > 0 && types.includes("poison")) {
        hazards.toxicSpikes = 0;
        game.log.push(`${plainName(member.entry.name)} absorveu Toxic Spikes ao entrar.`);
    } else if (grounded && hazards.toxicSpikes > 0 && !types.includes("steel") && !member.status &&
        game.fieldEffects.safeguardTurns[teamIndex] === 0 &&
        !(game.fieldEffects.terrain.name === "misty" && game.fieldEffects.terrain.turns > 0)) {
        
        const ailment = hazards.toxicSpikes > 1 ? "toxic" : "poison";
        member.status = { name: ailment, turnsRemaining: null, toxicStage: ailment === "toxic" ? 1 : 0 };
        
        game.log.push(`${plainName(member.entry.name)} ficou ${ailment === "toxic" ? "gravemente envenenado" : "envenenado"} pelas Toxic Spikes.`);
        consumeLumBerry(member);
    }

    // Sticky Web (reduz a Velocidade em 1 estágio se o Pokémon estiver no chão)
    if (member.currentHp > 0 && grounded && hazards.stickyWeb) {
        const current = member.statStages.speed || 0;
        const next = Math.max(-6, current - 1);
        member.statStages.speed = next;
        
        if (next < current) {
            game.log.push(`${plainName(member.entry.name)} teve a Velocidade reduzida por Sticky Web.`);
        }
    }
}


// 2. Cura uma quantidade específica de HP de um Pokémon, respeitando o limite máximo e o bloqueio de cura (Heal Block)
function healMember(member, amount) {
    if (member.moveEffects?.healBlockTurns > 0) return 0;
    
    const healed = Math.min(member.maxHp - member.currentHp, Math.max(0, Math.floor(amount)));
    member.currentHp += healed;
    return healed;
}


// 3. Registra efeitos visuais e sonoros decorrentes do uso de itens ou curas em batalha
function recordItemEffect(teamIndex, memberIndex, kind, label, hpBefore = null) {
    if (!game.visualEffects || memberIndex < 0) return;
    
    const effectKey = `${teamIndex}:${memberIndex}`;
    game.visualEffects.itemEffects.set(effectKey, { kind, label });

    if (kind === "heal") {
        if (!game.visualEffects.healedBefore.has(effectKey)) {
            const currentHp = game.teams[teamIndex].members[memberIndex].currentHp;
            game.visualEffects.healedBefore.set(effectKey, hpBefore ?? currentHp);
        }
        game.visualEffects.healedMembers.add(effectKey);
        playSoundEffect("heal");
    } else {
        playSoundEffect("item");
    }
}


// 4. Executa a cura de um Pokémon utilizando um item segurado e registra o efeito visual correspondente
function healWithHeldItem(teamIndex, memberIndex, amount, itemName) {
    const member = game.teams[teamIndex].members[memberIndex];
    const hpBefore = member.currentHp;
    const healed = healMember(member, amount);

    if (healed) {
        recordItemEffect(teamIndex, memberIndex, "heal", `+${healed} HP · ${itemName}`, hpBefore);
    }
    
    return healed;
}