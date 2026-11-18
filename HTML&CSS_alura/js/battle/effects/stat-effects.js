// Mantemencao da batalha: parte 117 e 118 (Organizadas e Limpas)

// 1. Aplica efeitos especiais de manipulação e troca de estágios de atributos (como Clear Smog, Psych-Up, Heart Swap, etc.)
function applyStatMoveEffect(attacker, target, move) {
    const stats = ["attack", "defense", "special-attack", "special-defense", "speed", "accuracy", "evasion"];

    // Clear Smog: reseta todos os estágios de atributos do alvo para o padrão (0)
    if (move.name === "clear-smog") {
        target.statStages = {};
        game.log.push(`${plainName(target.entry.name)} teve as alterações de atributos removidas por Clear Smog.`);
        return true;
    }

    // Psych-Up: o usuário copia todos os estágios de atributos do alvo
    if (move.name === "psych-up") {
        attacker.statStages = { ...target.statStages };
        game.log.push(`${plainName(attacker.entry.name)} copiou as alterações de atributos de ${plainName(target.entry.name)}.`);
        return true;
    }

    // Heart Swap: troca completamente os estágios de atributos entre o usuário e o alvo
    if (move.name === "heart-swap") {
        [attacker.statStages, target.statStages] = [target.statStages, attacker.statStages];
        game.log.push(`${plainName(attacker.entry.name)} e ${plainName(target.entry.name)} trocaram os estágios de atributos.`);
        return true;
    }

    // Power Swap / Guard Swap: troca estatísticas ofensivas (Ataque/Sp. Atk) ou defensivas (Defesa/Sp. Def)
    if (move.name === "power-swap" || move.name === "guard-swap") {
        const selectedStats = move.name === "power-swap"
            ? ["attack", "special-attack"]
            : ["defense", "special-defense"];
            
        selectedStats.forEach((stat) => {
            [attacker.statStages[stat], target.statStages[stat]] = [
                target.statStages[stat] || 0,
                attacker.statStages[stat] || 0
            ];
        });

        const statLabel = move.name === "power-swap" ? "os atributos ofensivos" : "os atributos defensivos";
        game.log.push(`${plainName(attacker.entry.name)} e ${plainName(target.entry.name)} trocaram ${statLabel}.`);
        return true;
    }

    // Acupressure: aumenta aleatoriamente em 2 estágios um atributo do alvo que ainda não esteja no máximo (+6)
    if (move.name === "acupressure") {
        const available = stats.filter((stat) => (target.statStages[stat] || 0) < 6);
        if (!available.length) return false;

        const stat = available[Math.floor(Math.random() * available.length)];
        target.statStages[stat] = Math.min(6, (target.statStages[stat] || 0) + 2);
        
        game.log.push(`${plainName(target.entry.name)} aumentou ${formatName(stat)} com Acupressure.`);
        return true;
    }

    return false;
}


// 2. Utiliza RegEx para verificar descritivamente se um golpe afeta/modifica os atributos do próprio usuário
function moveChangesUserStats(move) {
    return /user(?:'|’)?s.{0,40}(?:attack|defen[cs]e|special|speed|accuracy|evasion|stat)/i
        .test(getMoveEffectText(move));
}