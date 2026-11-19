// Mantemencao da batalha: parte 91 a 94 (Organizadas e Limpas)

// 1. Calcula a efetividade de um tipo de golpe contra um defensor, considerando imunidades e modificadores
function typeEffectiveness(moveType, defender) {
    let multiplier = 1;
    const effects = defender.moveEffects || {};
    
    // Telekinesis anula imunidade a Ground (exceto sob Gravidade)
    if (moveType === "ground" && effects.telekinesisTurns > 0 && game.fieldEffects.gravityTurns === 0) {
        return 0;
    }

    getMemberTypeNames(defender).forEach((type) => {
        const relations = game.typeDetails.get(type).damage_relations;
        
        // Identifica se há mira ativa que anula imunidades (Foresight/Miracle Eye)
        const identifiedImmunity = (effects.foresight && type === "ghost" && ["normal", "fighting"].includes(moveType)) ||
                                   (effects.miracleEye && type === "dark" && moveType === "psychic");

        // Verifica imunidades (no_damage_from)
        if (relations.no_damage_from.some(({ name }) => name === moveType)
            && !identifiedImmunity
            && !(moveType === "ground" && type === "flying"
                && (game.fieldEffects.gravityTurns > 0 || effects.grounded))) {
            multiplier = 0;
        }
        else if (relations.double_damage_from.some(({ name }) => name === moveType)) {
            multiplier *= 2;
        }
        else if (relations.half_damage_from.some(({ name }) => name === moveType)) {
            multiplier *= 0.5;
        }
    });

    // Modificadores externos de tipo (ex: Tar Shot dobra dano de Fire)
    if (moveType === "fire" && effects.tarShot) {
        multiplier *= 2;
    }

    return multiplier;
}


// 2. Verifica se um Pokémon está tocando o chão (afetado por terreno, gravidade, itens, etc.)
function isGrounded(member) {
    return game.fieldEffects.gravityTurns > 0 ||
           Boolean(member.moveEffects?.grounded) ||
           (!(member.moveEffects?.telekinesisTurns > 0) && !getMemberTypeNames(member).includes("flying"));
}


// 3. Determina o tipo real do golpe considerando condições de clima (Weather Ball) e campo (Ion Deluge)
function getEffectiveMoveType(move) {
    const { weather, ionDelugeTurn } = game.fieldEffects;
    
    if (move.name === "weather-ball" && weather.turns > 0) {
        return {
            rain: "water",
            sun: "fire",
            sandstorm: "rock",
            hail: "ice",
            snow: "ice"
        }[weather.name] || move.type.name;
    }
    
    if (move.type.name === "normal" && ionDelugeTurn === game.turn) {
        return "electric";
    }
    
    return move.type.name;
}


// 4. Calcula multiplicadores contextuais de dano (clima, terrenos, telas defensivas, auxílios)
function getMoveDamageMultiplier(attacker, defender, move, moveType, critical) {
    const { weather, terrain, screens } = game.fieldEffects;
    let multiplier = move.name === "weather-ball" && weather.turns > 0 ? 2 : 1;

    // Modificadores de Clima
    if (weather.turns > 0) {
        if (weather.name === "rain") {
            if (moveType === "water") multiplier *= 1.5;
            if (moveType === "fire") multiplier *= 0.5;
        } else if (weather.name === "sun") {
            if (moveType === "fire") multiplier *= 1.5;
            if (moveType === "water") multiplier *= 0.5;
        }
    }

    // Modificadores de Terreno (para atacantes no chão)
    if (terrain.turns > 0 && isGrounded(attacker)) {
        if ((terrain.name === "electric" && moveType === "electric") ||
            (terrain.name === "grassy" && moveType === "grass") ||
            (terrain.name === "psychic" && moveType === "psychic")) {
            multiplier *= 1.3;
        }
    }

    // Redução de dano por Misty Terrain em alvos no chão (Dragon)
    if (terrain.name === "misty" && terrain.turns > 0 && isGrounded(defender) && moveType === "dragon") {
        multiplier *= 0.5;
    }

    // Bônus de Helping Hand e esportes de campo (Mud Sport / Water Sport)
    if (attacker.moveEffects?.helpingHand) multiplier *= 1.5;
    if (moveType === "electric" && game.fieldEffects.mudSportTurns > 0) multiplier *= 0.5;
    if (moveType === "fire" && game.fieldEffects.waterSportTurns > 0) multiplier *= 0.5;

    // Aplicação de Telas Defensivas (Reflect, Light Screen, Aurora Veil)
    const defenseType = move.damage_class?.name === "physical" ? "reflect" : "lightScreen";
    const teamScreens = {
        reflect: screens.reflect[defender.teamIndex],
        lightScreen: screens.lightScreen[defender.teamIndex],
        auroraVeil: screens.auroraVeil[defender.teamIndex]
    };
    
    const screenActive = teamScreens[defenseType] > 0 || teamScreens.auroraVeil > 0;
    if (screenActive && !critical) {
        multiplier *= game.format === 2 ? 2 / 3 : 0.5;
    }

    return multiplier;
}