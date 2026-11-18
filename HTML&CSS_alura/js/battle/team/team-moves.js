// Mantemencao da batalha: parte 33 (Organizada e Limpa)
async function ensurePokemonMoves(pokemon) {
    if (uniqueMoves(pokemon.moves || []).length >= 4) return pokemon;
    
    const speciesUrl = pokemon.species?.url;
    if (!speciesUrl) throw new Error(`Não há movimentos disponíveis para ${pokemon.name}`);

    // 1. Armazena em cache os golpes da espécie para evitar requisições repetidas
    if (!speciesMoveCache.has(speciesUrl)) {
        speciesMoveCache.set(speciesUrl, (async () => {
            const species = await api.fetchJson(speciesUrl);
            const defaultVariety = species.varieties.find(({ is_default }) => is_default);
            
            if (!defaultVariety) throw new Error(`Forma padrão indisponível para ${pokemon.name}`);
            
            const defaultId = utils.pokemonIdFromUrl(defaultVariety.pokemon.url);
            const defaultPokemon = await api.getPokemon(defaultId);
            
            if (uniqueMoves(defaultPokemon.moves || []).length < 4) {
                throw new Error(`A espécie de ${pokemon.name} não possui quatro golpes disponíveis`);
            }
            return defaultPokemon.moves;
        })());
    }

    try {
        return { ...pokemon, moves: await speciesMoveCache.get(speciesUrl) };
    } catch (error) {
        speciesMoveCache.delete(speciesUrl);
        throw error;
    }
}


// Mantemencao da batalha: parte 34 (Organizada e Limpa)
function latestLearnLevel(moveEntry) {
    let level = 0;
    moveEntry.version_group_details.forEach(({ level_learned_at, move_learn_method }) => {
        if (move_learn_method.name === "level-up" && level_learned_at > 0) {
            level = level_learned_at;
        }
    });
    return level;
}


// Mantemencao da batalha: parte 35 (Organizada e Limpa)
function automaticMoves(moves) {
    const available = uniqueMoves(moves);
    
    // Seleciona os golpes aprendidos por nível mais alto primeiro
    const levelMoves = available
        .map((entry) => ({ entry, level: latestLearnLevel(entry) }))
        .filter(({ level }) => level > 0)
        .sort((a, b) => b.level - a.level || a.entry.move.name.localeCompare(b.entry.move.name))
        .map(({ entry }) => entry);
        
    const chosen = levelMoves.slice(0, 4);
    
    // Preenche com outros golpes disponíveis se faltarem vagas para fechar 4
    available.forEach((entry) => {
        if (chosen.length < 4 && !chosen.some(({ move }) => move.name === entry.move.name)) {
            chosen.push(entry);
        }
    });
    
    return chosen;
}


// Mantemencao da batalha: parte 36 (Organizada e Limpa)
function randomMoves(moves) {
    const available = uniqueMoves(moves);
    
    // Embaralhamento Fisher-Yates para selecionar golpes aleatórios
    for (let index = available.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
    }
    
    return available.slice(0, 4);
}


// Mantemencao da batalha: parte 37 (Organizada e Limpa)
function renderMovePreview(move) {
    const localizedDescription = move.flavor_text_entries?.find(({ language }) =>
        ["pt", "pt-br"].includes(language.name.toLowerCase())
    )?.flavor_text;
    
    const englishEffect = move.effect_entries?.find(({ language }) => language.name === "en")
        || move.effect_entries?.[0];
        
    const description = (localizedDescription || englishEffect?.short_effect || englishEffect?.effect
        || "Descrição indisponível.")
        .replace(/\$effect_chance/g, String(move.effect_chance ?? ""))
        .replace(/\s+/g, " ")
        .trim();
        
    const type = move.type?.name || "normal";
    const power = move.power ? `${move.power} de poder` : "Golpe de status";
    const accuracy = move.accuracy === null ? "Precisão infalível" : `${move.accuracy}% de precisão`;
    
    return `
        <div class="move-preview-heading">
            <strong>${formatName(move.name)}</strong>
            <span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>
        </div>
        <p>${escapeHTML(description)}</p>
        <span class="move-preview-meta">${power} · ${accuracy}</span>
    `;
}