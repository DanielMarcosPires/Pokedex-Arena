// Mantemencao da batalha: parte 119 a 121 (Organizadas e Limpas)

// 1. Aplica condições de status (Burn, Paralysis, Poison, Toxic, Sleep, Freeze) ou confusão a um Pokémon, validando imunidades, terrenos e proteções
function applyAilment(member, move, sourceTeamIndex) {
    const baseAilment = move.meta?.ailment?.name;
    const effectText = getMoveEffectText(move);
    
    // Distingue envenenamento normal de grave (Toxic) com base no texto do efeito
    const ailment = baseAilment === "poison" && /badly poisons/.test(effectText)
        ? "toxic"
        : baseAilment;

    if (!ailment || ailment === "none") return false;

    const supported = ["burn", "paralysis", "poison", "toxic", "sleep", "freeze", "confusion"];
    if (!supported.includes(ailment)) {
        game.log.push(`O efeito ${ailment} de ${formatName(move.name)} ainda não é simulado.`);
        return false;
    }

    // Calcula a chance de aplicação do status
    const chance = Number(move.meta?.ailment_chance) || Number(move.effect_chance) ||
        (move.damage_class.name === "status" ? 100 : 0);
        
    if (chance < 100 && Math.random() * 100 >= chance) return false;

    const terrain = game.fieldEffects.terrain;

    // Proteções de campo e salvaguardas (Safeguard, Misty Terrain, Electric Terrain)
    if (sourceTeamIndex !== member.teamIndex && (
        game.fieldEffects.safeguardTurns[member.teamIndex] > 0 ||
        (terrain.turns > 0 && terrain.name === "misty" && isGrounded(member)) ||
        (terrain.turns > 0 && terrain.name === "electric" && ailment === "sleep" && isGrounded(member))
    )) {
        game.log.push(`${plainName(member.entry.name)} foi protegido contra ${getAilmentLabel(ailment)}.`);
        return false;
    }

    const types = getMemberTypeNames(member);
    const immuneTypes = {
        burn: ["fire"],
        paralysis: ["electric"],
        poison: ["poison", "steel"],
        toxic: ["poison", "steel"],
        freeze: ["ice"]
    }[ailment] || [];

    // Validação de imunidades elementais por tipagem
    if (immuneTypes.some((type) => types.includes(type))) {
        game.log.push(`${plainName(member.entry.name)} é imune a ${getAilmentLabel(ailment)}.`);
        return false;
    }

    // Aplicação específica de Confusão (status volátil independente)
    if (ailment === "confusion") {
        if (member.confusionTurns > 0) return false;
        
        const minimum = move.meta?.min_turns || 2;
        const maximum = move.meta?.max_turns || 5;
        member.confusionTurns = minimum + Math.floor(Math.random() * (maximum - minimum + 1));
        
        game.log.push(`${plainName(member.entry.name)} ficou confuso.`);
        return true;
    }

    // Se o Pokémon já possuir outro status principal, não pode ser afetado novamente
    if (member.status) return false;

    const minimum = move.meta?.min_turns || 2;
    const maximum = move.meta?.max_turns || 4;
    const turnsRemaining = ailment === "sleep"
        ? minimum + Math.floor(Math.random() * (maximum - minimum + 1)) + 1
        : null;

    member.status = { name: ailment, turnsRemaining, toxicStage: ailment === "toxic" ? 1 : 0 };

    const ailmentLabels = {
        burn: "queimado",
        paralysis: "paralisado",
        poison: "envenenado",
        toxic: "gravemente envenenado",
        sleep: "dormindo",
        freeze: "congelado"
    };

    game.log.push(`${plainName(member.entry.name)} ficou ${ailmentLabels[ailment]}.`);
    
    // Tenta consumir Lum Berry caso o Pokémon a possua
    consumeLumBerry(member);
    return true;
}


// 2. Consome a Lum Berry para curar instantaneamente qualquer condição de status principal de um Pokémon
function consumeLumBerry(member) {
    if (member.heldItem !== "lum_berry" || !member.status) return false;

    member.status = null;
    member.heldItem = null;
    
    game.log.push(`${plainName(member.entry.name)} consumiu Lum Berry e curou sua condição de status.`);

    const teamIndex = member.teamIndex;
    const memberIndex = game.teams[teamIndex].members.indexOf(member);
    
    recordItemEffect(teamIndex, memberIndex, "cure", "Lum Berry · status curado");
    return true;
}


// 3. Valida se o Pokémon sofre de restrições para usar determinado golpe (Assault Vest, Disable, Encore, Taunt, Torment, Throat Chop)
function moveRestriction(member, move) {
    const effects = member.moveEffects || {};

    if (member.heldItem === "assault_vest" && move.damage_class.name === "status") {
        return "Assault Vest impede golpes de status.";
    }
    if (effects.disabledMove === move.name && effects.disableTurns > 0) {
        return "Golpe bloqueado por Disable.";
    }
    if (effects.encoreTurns > 0 && effects.encoreMove && effects.encoreMove !== move.name) {
        return `Encore obriga a repetir ${formatName(effects.encoreMove)}.`;
    }
    if (effects.tauntTurns > 0 && move.damage_class.name === "status") {
        return "Taunt impede golpes de status.";
    }
    if (effects.torment && effects.lastMove === move.name) {
        return "Torment impede repetir o mesmo golpe.";
    }
    if (effects.throatChopTurns > 0 && (SOUND_MOVES.has(move.name) || move.flags?.some(({ name }) => name === "sound"))) {
        return "Throat Chop bloqueia golpes sonoros.";
    }

    return "";
}