// Mantemencao da batalha: parte 21 a 24 (Organizadas e Limpas)

// 1. Carrega e sincroniza os times recebidos do servidor para iniciar a partida online
async function loadOnlineTeams(payload) {
    if (!onlineMode || onlineTeamsLoading || onlineBattleStarted) return;
    
    if (!Array.isArray(payload?.teams) || payload.teams.length !== 2) {
        throw new Error("O servidor enviou uma configuração de times inválida.");
    }

    console.log("[DBG] loadOnlineTeams recebeu format:", payload?.format, "select atual:", document.querySelector("#battle-format")?.value);

    if (typeof payload.format !== "undefined" && typeof applySyncedBattleFormat === "function") {
        applySyncedBattleFormat(payload.format);
    }

    
    onlineTeamsLoading = true;
    onlineTeamSubmitted = true;
    startButton.disabled = true;
    setOnlineLobbyStatus("Carregando os times da sala...");

    try {
        for (let teamIndex = 0; teamIndex < 2; teamIndex++) {
            const config = payload.teams[teamIndex];
            
            if (!config || !Array.isArray(config.slots) || config.slots.length !== 6) {
                throw new Error(`O Time ${teamIndex + 1} recebido está incompleto.`);
            }

            const existing = pokemonTeams[teamIndex];
            const matchesLocalTeam = teamIndex === onlineRole &&
                existing.every((slot, index) => slot?.entry.id === config.slots[index].pokemonId);

            // Reutiliza o time local se corresponder ou carrega os dados dos Pokémon em concorrência
            const localPokemon = matchesLocalTeam
                ? existing
                : await mapWithConcurrency(config.slots, 6, async (slot) => {
                    const entry = pokemonList.find(({ id }) => id === slot.pokemonId);
                    
                    if (!entry || !isSelectablePokemon(entry)) {
                        throw new Error(`Pokémon indisponível: ${slot.pokemonId}`);
                    }
                    
                    return {
                        entry,
                        pokemon: await ensurePokemonMoves(await api.getPokemon(entry.id)),
                        heldItem: slot.heldItem,
                        selectedMoves: slot.moveNames,
                        loading: false
                    };
                });

            pokemonTeams[teamIndex] = localPokemon.map((slot, index) => ({
                ...slot,
                heldItem: config.slots[index].heldItem,
                selectedMoves: [...config.slots[index].moveNames],
                loading: false
            }));

            playerNames[teamIndex] = config.name;
            teamModes[teamIndex] = "manual";
        }

        renderTeamBuilder();
        await startBattle();

        if (!onlineBattleStarted) {
            throw new Error("A batalha não foi iniciada.");
        }

        await emitOnlineRequest("battle:ready", { roomCode: onlineRoomCode });
    } finally {
        onlineTeamsLoading = false;
        updateOnlineLobby();
    }
}


// 2. Filtra e valida se um Pokémon pode ser selecionado (exclui formulários Mega, Gmax e Dynamax)
function isSelectablePokemon(pokemon) {
    return !/(?:-mega(?:-|$)|-(?:gmax|gigantamax|dynamax|eternamax|primal)(?:-|$))/i.test(pokemon.name);
}


// 3. Retorna a URL do sprite correspondente ao item segurado
function itemSpriteUrl(itemName) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName.replace(/_/g, "-")}.png`;
}


// 4. Retorna a lista completa de itens disponíveis para um determinado Pokémon (incluindo itens gerais e Mega Stones compatíveis)
function itemsForPokemon(pokemonName) {
    return [
        { name: "", title: "Sem item", description: "Este Pokémon não segurará nenhum item." },
        
        // Mapeamento de itens segurados gerais (Held Items)
        ...Object.entries(HELD_ITEMS).map(([name, description]) => ({
            name,
            title: formatName(name.replace(/_/g, "-")),
            description: description.split(" · ").slice(1).join(" · ")
        })),
        
        // Mapeamento de Mega Stones compatíveis com o Pokémon atual
        ...Object.entries(MEGA_STONES)
            .filter(([, formName]) =>
                formName.startsWith(`${pokemonName}-mega`) &&
                pokemonList.some(({ name }) => name === formName)
            )
            .map(([name]) => ({
                name,
                title: formatName(name.replace(/_/g, "-")),
                description: "Permite Mega Evoluir este Pokémon uma vez durante a batalha."
            }))
    ];
}