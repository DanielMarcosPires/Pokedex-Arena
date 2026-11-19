// Mantemencao da batalha: parte 40 (Organizada e Limpa)
async function randomizeTeam(teamIndex) {
    const selectablePokemon = pokemonList.filter(isSelectablePokemon);
    
    // 1. Validação inicial de estado e disponibilidade
    if (teamRandomizing[teamIndex] || pokemonTeams[teamIndex].some((slot) => slot?.loading) || selectablePokemon.length < 6) {
        setSetupMessage("Aguarde o carregamento dos Pokémon antes de sortear o time.", true);
        return;
    }

    const previousTeam = pokemonTeams[teamIndex];
    const shuffled = [...selectablePokemon];
    
    // 2. Embaralhamento usando o algoritmo Fisher-Yates
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    
    const entries = shuffled.slice(0, 6);
    teamRandomizing[teamIndex] = true;
    
    // 3. Configuração prévia dos slots como "carregando"
    pokemonTeams[teamIndex] = entries.map((entry) => ({
        entry,
        pokemon: null,
        heldItem: null,
        selectedMoves: [],
        loading: true
    }));
    
    setSetupMessage(`Sorteando seis Pokémon para o Time ${teamIndex + 1}...`, false);
    renderTeamBuilder();

    try {
        // 4. Carregamento assíncrono em lotes concorrentes
        const pokemonDetails = await mapWithConcurrency(entries, 6, async ({ id }) =>
            ensurePokemonMoves(await api.getPokemon(id))
        );
        
        pokemonTeams[teamIndex].forEach((slot, index) => {
            slot.pokemon = pokemonDetails[index];
            slot.loading = false;
        });
        
        setSetupMessage(`Time ${teamIndex + 1} sorteado com seis Pokémon diferentes.`, false);
    } catch (error) {
        console.error(`Erro ao sortear Pokémon para o Time ${teamIndex + 1}:`, error);
        pokemonTeams[teamIndex] = previousTeam;
        setSetupMessage(`Não foi possível sortear o Time ${teamIndex + 1}. Tente novamente.`, true);
    } finally {
        teamRandomizing[teamIndex] = false;
        renderTeamBuilder();
    }
}


// Mantemencao da batalha: parte 41 (Organizada e Limpa)
async function selectPokemon(teamIndex, slotIndex, selection) {
    const { entry, heldItem, selectedMoves, moveDetails, pokemon } = selection;
    const currentSlot = pokemonTeams[teamIndex][slotIndex];

    // 1. Atualização rápida caso o Pokémon já esteja carregado no slot
    if (currentSlot?.entry.id === entry.id && currentSlot.pokemon) {
        currentSlot.heldItem = heldItem;
        currentSlot.selectedMoves = [...selectedMoves];
        currentSlot.moveDetails = { ...moveDetails };
        renderTeamBuilder();
        return;
    }

    // 2. Inicialização do slot com estado de carregamento
    const slot = {
        entry,
        pokemon: null,
        heldItem,
        selectedMoves: [...selectedMoves],
        moveDetails: { ...moveDetails },
        loading: true
    };
    
    pokemonTeams[teamIndex][slotIndex] = slot;
    renderTeamBuilder();
    setSetupMessage("", false);

    try {
        // 3. Busca e garantia de golpes do novo Pokémon
        slot.pokemon = await ensurePokemonMoves(pokemon || await api.getPokemon(entry.id));
        
        if (pokemonTeams[teamIndex][slotIndex] !== slot) return;
        
        slot.loading = false;
        renderTeamBuilder();
    } catch (error) {
        console.error(`Erro ao carregar ${entry.name} para a batalha:`, error);
        
        if (pokemonTeams[teamIndex][slotIndex] === slot) {
            slot.loading = false;
            renderTeamBuilder();
            setSetupMessage(`Não foi possível carregar ${formatName(entry.name)}. Tente selecionar novamente.`, true);
        }
    }
}