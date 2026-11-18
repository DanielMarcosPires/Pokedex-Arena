// Mantemencao da batalha: parte 107 a 109 (Organizadas e Limpas)

// 1. Calcula o dano fixo causado por golpes especiais (como OHKO, Final Gambit, Counter, Mirror Coat, Seismic Toss, etc.)
function getFixedDamage(move, attacker, target) {
    if (move.meta?.category?.name === "ohko") return target.currentHp;
    if (move.name === "final-gambit") return attacker.currentHp;
    if (move.name === "endeavor") return Math.max(0, target.currentHp - attacker.currentHp);
    
    // Counter (reflete 2x o dano físico sofrido no turno)
    if (move.name === "counter" && attacker.damageTakenThisTurn > 0 &&
        attacker.lastDamageClassThisTurn === "physical") {
        return attacker.damageTakenThisTurn * 2;
    }
    
    // Mirror Coat (reflete 2x o dano especial sofrido no turno)
    if (move.name === "mirror-coat" && attacker.damageTakenThisTurn > 0 &&
        attacker.lastDamageClassThisTurn === "special") {
        return attacker.damageTakenThisTurn * 2;
    }
    
    // Metal Burst (reflete 1.5x o dano total sofrido no turno)
    if (move.name === "metal-burst" && attacker.damageTakenThisTurn > 0) {
        return Math.floor(attacker.damageTakenThisTurn * 1.5);
    }

    const effect = getMoveEffectText(move);

    // Danos baseados no nível do usuário (ex: Seismic Toss, Night Shade)
    if (/damage equal to (?:the )?user.?s level/i.test(effect)) {
        return BATTLE_LEVEL;
    }

    // Dano fixo numérico extraído da descrição do golpe
    const fixedDamage = effect.match(/inflicts? (\d+) (?:points? of )?damage/i);
    return fixedDamage ? Number(fixedDamage[1]) : null;
}


// 2. Determina aleatoriamente a quantidade de acertos de golpes multi-hit (ex: Double Hit, Bullet Seed, Icicle Spear)
function getHitCount(move) {
    const minimum = move.meta?.min_hits;
    const maximum = move.meta?.max_hits;

    if (!minimum || !maximum || minimum === maximum) return minimum || 1;

    // Distribuição oficial de probabilidade para golpes de 2 a 5 acertos (ex: Fury Swatts, Pin Missile)
    if (minimum === 2 && maximum === 5) {
        const roll = Math.random();
        return roll < 3 / 8 ? 2 : roll < 6 / 8 ? 3 : roll < 7 / 8 ? 4 : 5;
    }

    return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}


// 3. Aplica o dano no HP do Pokémon, atualiza o registro de efeitos visuais (danos acumulados, HP anterior) e reproduz som de impacto
function recordDamage(teamIndex, memberIndex, amount, damageKind = "move") {
    const member = game.teams[teamIndex].members[memberIndex];
    const damage = Math.min(member.currentHp, Math.max(0, Math.floor(amount)));
    
    if (!damage) return 0;

    const effectKey = `${teamIndex}:${memberIndex}`;

    // Armazena o HP antes de sofrer o dano para animações de barra de vida
    if (!game.visualEffects.damagedBefore.has(effectKey)) {
        game.visualEffects.damagedBefore.set(effectKey, member.currentHp);
    }

    // Acumula o dano total sofrido no turno para efeitos visuais
    game.visualEffects.damageAmounts.set(
        effectKey,
        (game.visualEffects.damageAmounts.get(effectKey) || 0) + damage
    );

    if (damageKind === "status" || !game.visualEffects.damageKinds.has(effectKey)) {
        game.visualEffects.damageKinds.set(effectKey, damageKind);
    }

    // Toca o efeito sonoro de impacto apenas na primeira ocorrência de dano ao Pokémon no turno
    if (!game.visualEffects.hitMembers.has(effectKey)) {
        playSoundEffect("hit");
    }
    
    game.visualEffects.hitMembers.add(effectKey);
    member.currentHp -= damage;
    
    return damage;
}