// Mantemencao da batalha: parte 114 a 116 (Organizadas e Limpas)

// 1. Ativa movimentos de proteção pessoal ou de equipe, aplicando verificações de uso consecutivo (chance de falha)
function activateProtection(action, move) {
    const attacker = game.teams[action.teamIndex].members[action.attackerIndex];
    const moveName = move.name;

    // Mat Block só pode ser usado no primeiro turno em que o Pokémon entra em campo
    if (moveName === "mat-block" && attacker.entryTurn !== game.turn) {
        game.log.push(`${plainName(attacker.entry.name)} usou Mat Block, mas só funciona no turno em que entra em campo.`);
        return false;
    }

    // Verifica se o uso de proteção é consecutivo para aplicar a penalidade exponencial de falha (1 / 3^n)
    const consecutive = attacker.lastProtectionTurn === game.turn - 1;
    if (!consecutive) attacker.protectionChain = 0;

    if (attacker.protectionChain > 0 && Math.random() >= 1 / (3 ** attacker.protectionChain)) {
        attacker.protectionChain = 0;
        attacker.lastProtectionTurn = null;
        game.log.push(`${plainName(attacker.entry.name)} tentou usar ${formatName(moveName)}, mas a proteção falhou.`);
        return false;
    }

    attacker.protectionChain++;
    attacker.lastProtectionTurn = game.turn;

    // Define o tipo de proteção aplicada (pessoal, de equipe ou Endure)
    if (PERSONAL_PROTECTION_MOVES.has(moveName)) {
        attacker.protectedTurn = game.turn;
    } else if (moveName === "endure") {
        attacker.enduredTurn = game.turn;
    } else if (moveName === "wide-guard") {
        game.fieldEffects.wideGuardTurn[action.teamIndex] = game.turn;
    } else if (moveName === "quick-guard") {
        game.fieldEffects.quickGuardTurn[action.teamIndex] = game.turn;
    } else if (moveName === "mat-block") {
        game.fieldEffects.matBlockTurn[action.teamIndex] = game.turn;
    }

    const messages = {
        protect: "se protegeu contra ataques.",
        detect: "detectou e bloqueou ataques.",
        "max-guard": "se protegeu com Max Guard.",
        endure: "se preparou para resistir a golpes fatais.",
        "wide-guard": "protegeu a equipe contra golpes que atingem vários alvos.",
        "quick-guard": "protegeu a equipe contra golpes prioritários.",
        "mat-block": "ergueu uma barreira para proteger a equipe."
    };

    game.log.push(`${plainName(attacker.entry.name)} ${messages[moveName]}`);
    game.visualEffects.protectedMembers?.add(`${action.teamIndex}:${action.attackerIndex}`);

    return true;
}


// 2. Valida se um golpe recebido é bloqueado por barreiras ativas, terreno psíquico ou proteções de equipe
function protectionBlocksMove(action, target) {
    const member = target?.member || target;
    if (!member) return false;

    // Se o alvo for do mesmo time ou o golpe ignorar proteções, não bloqueia
    if (target.teamIndex === action.teamIndex || PROTECTION_BYPASS_MOVES.has(action.move.name)) {
        return false;
    }

    // Proteção individual (Protect, Detect, etc.)
    if (member.protectedTurn === game.turn) {
        // Garante que o Set existe antes de adicionar
        if (!game.visualEffects.protectedMembers) {
            game.visualEffects.protectedMembers = new Set();
        }

        // Adiciona o efeito usando o formato correto de identificador do membro
        game.visualEffects.protectedMembers.add(`${target.teamIndex}:${member.index}`);

        game.log.push(`${plainName(member.entry.name)} se protegeu contra ${formatName(action.move.name)}!`);

        // REDENDE A TELA IMEDIATAMENTE PARA MOSTRAR O EFEITO VISUAL E O LOG
        renderBattle();

        return true;
    }

    // Psychic Terrain bloqueia golpes com prioridade positiva contra Pokémon no chão
    if (game.fieldEffects?.terrain?.name === "psychic" && game.fieldEffects.terrain.turns > 0 &&
        isGrounded(member) && action.move.priority > 0) {
        game.log.push(`${plainName(member.entry.name)} está protegido pelo Campo Psíquico!`);
        return true;
    }

    // Quick Guard protege contra golpes de prioridade positiva
    if (action.move.priority > 0 && game.fieldEffects?.quickGuardTurn?.[target.teamIndex] === game.turn) {
        game.log.push(`Quick Guard protegeu ${plainName(member.entry.name)} contra o ataque prioritário!`);
        return true;
    }

    // Wide Guard protege contra golpes em área (spread moves)
    const spreadTargets = ["all-opponents", "all-other-pokemon", "all-pokemon"];
    if (spreadTargets.includes(action.move.target?.name) &&
        game.fieldEffects?.wideGuardTurn?.[target.teamIndex] === game.turn) {
        game.log.push(`Wide Guard protegeu a equipe contra o ataque em área!`);
        return true;
    }

    // Crafty Shield protege contra golpes de status
    if (action.move.damage_class?.name === "status" &&
        game.fieldEffects?.craftyShieldTurn?.[target.teamIndex] === game.turn) {
        game.log.push(`Crafty Shield protegeu ${plainName(member.entry.name)} contra o golpe de status!`);
        return true;
    }

    // Mat Block protege contra golpes de dano
    if (action.move.damage_class?.name !== "status" &&
        game.fieldEffects?.matBlockTurn?.[target.teamIndex] === game.turn) {
        game.log.push(`Mat Block protegeu ${plainName(member.entry.name)} contra o ataque!`);
        return true;
    }

    return false;
}


// 3. Aplica modificações de estágios de atributos (stat changes) em um Pokémon, respeitando o Mist e limites de -6 a +6
function applyStatChanges(member, move, sourceTeamIndex) {
    const changes = move.stat_changes || [];
    if (!changes.length) return false;

    // Efeito de Mist: impede reduções de atributos provocadas por adversários
    if (sourceTeamIndex !== member.teamIndex &&
        game.fieldEffects.mistTurns[member.teamIndex] > 0 &&
        changes.some(({ change }) => change < 0)) {
        game.log.push(`${plainName(member.entry.name)} foi protegido de alterações negativas por Mist.`);
        return false;
    }

    // Verifica a chance de ativação do efeito de atributo
    const chance = Number(move.meta?.stat_chance) || Number(move.effect_chance) ||
        (move.damage_class.name === "status" ? 100 : 0);

    if (chance < 100 && Math.random() * 100 >= chance) return false;

    const labels = {
        attack: "Ataque",
        defense: "Defesa",
        "special-attack": "Ataque Especial",
        "special-defense": "Defesa Especial",
        speed: "Velocidade",
        accuracy: "Precisão",
        evasion: "Esquiva"
    };

    let changed = false;

    changes.forEach(({ change, stat }) => {
        const name = stat.name;
        const current = member.statStages[name] || 0;
        const next = Math.max(-6, Math.min(6, current + change));

        if (next === current) return;

        member.statStages[name] = next;
        changed = true;

        game.visualEffects.statChanges?.add(`${member.teamIndex}:${member.index}:${name}`);
        game.log.push(`${plainName(member.entry.name)} ${change > 0 ? "aumentou" : "reduziu"} ${labels[name] || name} ${Math.abs(next - current)} estágio(s).`);
    });

    return changed;
}