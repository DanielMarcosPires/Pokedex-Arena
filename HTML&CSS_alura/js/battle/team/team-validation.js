// Mantemencao da batalha: parte 55 (Organizada e Limpa)
function validateTeams(teamIndices = [0, 1]) {
    for (const teamIndex of teamIndices) {
        const slots = pokemonTeams[teamIndex];
        const pokemonsValidos = slots.filter((slot) => slot && slot.pokemon);

        // 1. Validação de quantidade (mínimo 1, máximo 6)
        if (pokemonsValidos.length < 1 || pokemonsValidos.length > 6) {
            setSetupMessage(`Monte no mínimo 1 e no máximo 6 Pokémon para o Time ${teamIndex + 1} e aguarde o carregamento.`, true);
            return false;
        }

        // 2. Validação de duplicatas (compara IDs únicos com o total de válidos)
        if (new Set(pokemonsValidos.map((slot) => slot.entry.id)).size !== pokemonsValidos.length) {
            setSetupMessage(`Cada Pokémon do Time ${teamIndex + 1} deve ser diferente.`, true);
            return false;
        }

        // 3. Validação de golpes para o modo manual
        if (teamModes[teamIndex] === "manual" && pokemonsValidos.some((slot) => {
            const selectedMoves = Array.from({ length: 4 }, (_, index) => slot.selectedMoves?.[index]);
            return selectedMoves.some((name) => !name) || new Set(selectedMoves).size !== 4;
        })) {
            setSetupMessage(`Escolha quatro golpes diferentes para cada Pokémon do Time ${teamIndex + 1}.`, true);
            return false;
        }
    }
    return true;
}


// Mantemencao da batalha: parte 56 (Organizada e Limpa)
function chooseMoves(slot, mode) {
    const available = uniqueMoves(slot.pokemon.moves);
    
    if (mode === "automatic") return automaticMoves(available);
    if (mode === "random") return randomMoves(available);
    
    return slot.selectedMoves
        .map((name) => available.find(({ move }) => move.name === name))
        .filter(Boolean);
}


// Mantemencao da batalha: parte 57 (Organizada e Limpa)
async function mapWithConcurrency(items, limit, callback) {
    const results = new Array(items.length);
    let nextIndex = 0;
    
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await callback(items[index], index);
        }
    });
    
    await Promise.all(workers);
    return results;
}


// Mantemencao da batalha: parte 58 (Organizada e Limpa)
function statValue(pokemon, statName) {
    return pokemon.stats.find(({ stat }) => stat.name === statName)?.base_stat || 1;
}


// Mantemencao da batalha: parte 59 (Organizada e Limpa)
function calculateBattleHp(pokemon) {
    const baseHp = statValue(pokemon, "hp");
    return Math.floor((2 * baseHp * BATTLE_LEVEL) / 100) + BATTLE_LEVEL + 10;
}