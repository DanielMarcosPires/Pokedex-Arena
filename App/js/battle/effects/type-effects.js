// Mantemencao da batalha: parte 124 (Organizada e Limpa)

// Aplica efeitos de golpes que modificam temporariamente ou permanentemente a tipagem de um Pokémon (atacante ou alvo)
function applyTypeMoveEffect(attacker, target, move) {
    const targetTypes = getMemberTypeNames(target);
    const attackerTypes = getMemberTypeNames(attacker);
    
    // Identifica se o golpe afeta o próprio usuário (atacante) em vez do oponente
    const changesAttacker = [
        "reflect-type", "conversion", "conversion-2", "camouflage", "roost"
    ].includes(move.name);
    
    let nextTypes = null;

    // 1. Golpes que alteram a tipagem com base em condições fixas ou no alvo
    if (move.name === "soak") {
        nextTypes = ["water"];
    }
    if (move.name === "magic-powder") {
        nextTypes = ["psychic"];
    }
    if (move.name === "forest's-curse" && !targetTypes.includes("grass")) {
        nextTypes = [...targetTypes, "grass"];
    }
    if (move.name === "trick-or-treat" && !targetTypes.includes("ghost")) {
        nextTypes = [...targetTypes, "ghost"];
    }
    if (move.name === "reflect-type" && targetTypes.length) {
        nextTypes = targetTypes;
    }

    // 2. Conversion e Conversion-2 (modificadores baseados nos próprios movimentos)
    if (move.name === "conversion") {
        const firstMoveType = attacker.moves.find(({ type }) => type?.name)?.type?.name;
        if (firstMoveType && !attackerTypes.includes(firstMoveType)) {
            nextTypes = [firstMoveType];
        }
    }
    if (move.name === "conversion-2") {
        const previousType = attacker.moveEffects?.previousMoveType;
        const resistantTypes = previousType
            ? ALL_TYPE_NAMES.filter((type) => {
                const relations = game.typeDetails.get(type).damage_relations;
                return relations.half_damage_from.some(({ name }) => name === previousType) ||
                       relations.no_damage_from.some(({ name }) => name === previousType);
            }).filter((type) => !attackerTypes.includes(type))
            : [];
            
        if (resistantTypes.length) {
            nextTypes = [resistantTypes[Math.floor(Math.random() * resistantTypes.length)]];
        }
    }

    // 3. Camouflage (baseado no terreno ativo em campo)
    if (move.name === "camouflage") {
        nextTypes = [{
            electric: "electric",
            grassy: "grass",
            misty: "fairy",
            psychic: "psychic"
        }[game.fieldEffects.terrain.name] || "normal"];
    }

    // 4. Roost (remove temporariamente o tipo Flying se o usuário o possuir)
    if (move.name === "roost") {
        if (attackerTypes.includes("flying")) {
            attacker.moveEffects.roostOriginalTypes = [...attackerTypes];
            attacker.moveEffects.roostRestoreTurn = game.turn;
            nextTypes = attackerTypes.filter((type) => type !== "flying");
        }
    }

    // 5. Validação e aplicação dos novos tipos definidos
    if (nextTypes) {
        const recipient = changesAttacker ? attacker : target;
        const currentTypes = changesAttacker ? attackerTypes : targetTypes;
        
        // Se a tipagem resultante for idêntica à atual, nenhuma alteração é feita
        if (nextTypes.length === currentTypes.length &&
            nextTypes.every((type, index) => type === currentTypes[index])) {
            return false;
        }

        setMemberTypeNames(recipient, nextTypes);
        
        game.log.push(`${plainName(recipient.entry.name)} agora tem tipagem ${
            nextTypes.length ? nextTypes.map(typeLabel).join(" / ") : "neutra"
        }.`);
        
        return true;
    }

    return false;
}