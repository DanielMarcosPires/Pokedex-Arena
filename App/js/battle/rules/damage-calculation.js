// Mantemencao da batalha: parte 95 a 98 (Organizadas e Limpas)

// 1. Calcula o atributo real de um Pokémon em batalha (considerando estágios, clima, itens, status e Wonder Room)
function getBattleStat(member, statName, stageOverride) {
    // Aplicação de Wonder Room (inverte Defesa e Defesa Especial)
    const statKey = game.fieldEffects.wonderRoomTurns > 0
        ? ({ defense: "special-defense", "special-defense": "defense" }[statName] || statName)
        : statName;

    const base = member.transformedStats?.[statKey] || statValue(member.pokemon, statKey);
    const stage = Math.max(-6, Math.min(6, stageOverride ?? member.statStages[statName] ?? 0));
    const stageMultiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
    let value = base * stageMultiplier;

    const types = getMemberTypeNames(member);

    // Modificadores de Clima (Sandstorm aumenta Sp. Def de Rock; Snow aumenta Def de Ice)
    if (statKey === "special-defense" && game.fieldEffects.weather.name === "sandstorm"
        && game.fieldEffects.weather.turns > 0 && types.includes("rock")) {
        value *= 1.5;
    }
    if (statKey === "defense" && game.fieldEffects.weather.name === "snow"
        && game.fieldEffects.weather.turns > 0 && types.includes("ice")) {
        value *= 1.5;
    }

    // Penalidades de Status (Burn reduz Ataque; Paralysis reduz Velocidade)
    if (member.status?.name === "burn" && statName === "attack") value *= 0.5;
    if (member.status?.name === "paralysis" && statName === "speed") value *= 0.5;

    // Bônus de campo (Tailwind dobra Velocidade)
    if (statName === "speed" && game.fieldEffects.tailwindTurns[member.teamIndex] > 0) {
        value *= 2;
    }

    // Bônus de Itens Segurados (Assault Vest e Eviolite)
    if ((member.heldItem === "assault_vest" && statName === "special-defense") ||
        (member.heldItem === "eviolite" && member.evioliteEligible && ["defense", "special-defense"].includes(statName))) {
        value *= 1.5;
    }

    return Math.max(1, Math.floor(value));
}


// 2. Calcula a precisão real de um golpe com base na precisão base, estágios e gravidade
function getMoveAccuracy(move, attacker, target) {
    if (move.accuracy === null || move.accuracy === undefined) return null;

    let base = move.meta?.category?.name === "ohko"
        ? move.accuracy + BATTLE_LEVEL - BATTLE_LEVEL
        : move.accuracy;

    if (game.fieldEffects.gravityTurns > 0) base *= 5 / 3;

    const stageMultiplier = (stage) => stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);
    const accuracy = stageMultiplier(attacker.statStages.accuracy || 0);
    const evasion = stageMultiplier(target.statStages.evasion || 0);

    return Math.max(1, Math.min(100, base * accuracy / evasion));
}


// 3. Executa o cálculo completo de dano de um golpe (com STAB, crítico, tipo, itens e randomização)
function calculateDamage(attacker, defender, move, effectiveness, moveType) {
    if (!getMovePower(move, attacker) || move.damage_class.name === "status" || effectiveness === 0) {
        return { amount: 0, critical: false };
    }

    const physical = move.damage_class.name === "physical";
    
    // Tratamento para golpes com atributos alternativos (Foul Play, Body Press, Psyshock)
    const attackStat = move.name === "foul-play" ? "attack"
        : move.name === "body-press" ? "defense"
        : physical ? "attack" : "special-attack";
        
    const defenseStat = physical || ["psyshock", "psystrike", "secret-sword"].includes(move.name)
        ? "defense" : "special-defense";

    // Cálculo de Acerto Crítico
    const criticalStage = Math.min(3, (attacker.criticalStage || 0) + (move.meta?.crit_rate || 0));
    const criticalRates = [1 / 24, 1 / 8, 1 / 2, 1];
    const critical = game.fieldEffects.luckyChantTurns[defender.teamIndex] <= 0
        && Math.random() < criticalRates[criticalStage];

    const attackMember = move.name === "foul-play" ? defender : attacker;
    const attackStage = attackMember.statStages[attackStat] || 0;
    const defenseStage = defender.statStages[defenseStat] || 0;

    const attack = getBattleStat(attackMember, attackStat, critical && attackStage < 0 ? 0 : undefined);
    const defense = getBattleStat(defender, defenseStat, critical && defenseStage > 0 ? 0 : undefined);
    const power = getMovePower(move, attacker, defender);

    // Fórmula base de dano oficial dos jogos Pokémon
    const base = Math.floor((((2 * BATTLE_LEVEL / 5 + 2) * power * attack / defense) / 50) + 2);
    
    const stab = getMemberTypeNames(attacker).includes(moveType) ? 1.5 : 1;
    const fieldMultiplier = getMoveDamageMultiplier(attacker, defender, move, moveType, critical);
    const itemMultiplier = getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness);
    const criticalMultiplier = critical ? 1.5 : 1;

    // Cálculo final aplicando variação de roll aleatório (85% a 100%)
    const finalAmount = base * stab * effectiveness * fieldMultiplier * criticalMultiplier - itemMultiplier * (0.85 + Math.random() * 0.15);

    return {
        amount: Math.max(1, Math.floor(finalAmount)),
        critical
    };
}


// 4. Retorna o multiplicador de dano concedido por itens segurados (Life Orb, Expert Belt, bônus de tipo, etc.)
function getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness) {
    let multiplier = 1;

    if (attacker.heldItem === "life_orb") multiplier *= 1.3;
    if (attacker.heldItem === "expert_belt" && effectiveness > 1) multiplier *= 1.2;
    if (attacker.heldItem === "muscle_band" && move.damage_class.name === "physical") multiplier *= 1.1;
    if (attacker.heldItem === "wise_glasses" && move.damage_class.name === "special") multiplier *= 1.1;

    // Tabela de itens impulsionadores de tipos específicos
    const typeItems = {
        charcoal: "fire", mystic_water: "water", miracle_seed: "grass", magnet: "electric",
        never_melt_ice: "ice", black_belt: "fighting", poison_barb: "poison", soft_sand: "ground",
        sharp_beak: "flying", twisted_spoon: "psychic", silver_powder: "bug", hard_stone: "rock",
        spell_tag: "ghost", dragon_fang: "dragon", black_glasses: "dark", metal_coat: "steel",
        pixie_plate: "fairy"
    };

    if (typeItems[attacker.heldItem] === moveType) {
        multiplier *= 1.2;
    }

    return multiplier;
}