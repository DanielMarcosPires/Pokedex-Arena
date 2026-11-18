// Mantemencao da batalha: parte 25 (Organizada e Limpa)
async function isEvioliteEligible(pokemon) {
    const speciesUrl = pokemon.species?.url;
    if (!speciesUrl) throw new Error(`Espécie indisponível para verificar Eviolite em ${pokemon.name}`);
    
    // Armazena em cache se a espécie possui evoluções futuras (necessário para o Eviolite)
    if (!evolutionEligibilityCache.has(speciesUrl)) {
        evolutionEligibilityCache.set(speciesUrl, (async () => {
            const species = await api.fetchJson(speciesUrl);
            const evolutionChain = await api.fetchJson(species.evolution_chain.url);
            
            const findSpecies = (node) => {
                if (node.species.name === species.name) return node.evolves_to.length > 0;
                for (const evolution of node.evolves_to) {
                    const eligible = findSpecies(evolution);
                    if (eligible !== null) return eligible;
                }
                return null;
            };
            
            const eligible = findSpecies(evolutionChain.chain);
            if (typeof eligible !== "boolean") {
                throw new Error(`Espécie não encontrada na cadeia evolutiva de ${pokemon.name}`);
            }
            return eligible;
        })());
    }
    
    try {
        return await evolutionEligibilityCache.get(speciesUrl);
    } catch (error) {
        evolutionEligibilityCache.delete(speciesUrl);
        throw error;
    }
}


// Mantemencao da batalha: parte 26 (Organizada e Limpa)
function plainName(name) {
    return String(name).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}


// Mantemencao da batalha: parte 27 (Organizada e Limpa)
function getMemberTypeNames(member) {
    return member.currentTypes || member.pokemon.types.map(({ type }) => type.name);
}


// Mantemencao da batalha: parte 28 (Organizada e Limpa)
function setMemberTypeNames(member, types) {
    member.currentTypes = [...new Set(types)];
}


// Mantemencao da batalha: parte 29 (Organizada e Limpa)
function memberResetTypes(member) {
    return member.megaEvolved ? member.megaTypes : member.originalTypes;
}


// Mantemencao da batalha: parte 30 (Organizada e Limpa)
function canMegaEvolve(member, teamIndex, activeSlot) {
    const actionAlreadyQueued = game.pendingActions[teamIndex]
        .some((action) => action.megaEvolve);
        
    return Boolean(
        member.megaPokemon &&
        member.heldItem &&
        !game.megaUsed[teamIndex] &&
        !actionAlreadyQueued
    );
}


// Mantemencao da batalha: parte 31 (Organizada e Limpa)
function waitForAnimation(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}


// Mantemencao da batalha: parte 32 (Organizada e Limpa)
function uniqueMoves(moves) {
    return [...new Map(moves.map((entry) => [entry.move.name, entry])).values()]
        .sort((a, b) => a.move.name.localeCompare(b.move.name));
}