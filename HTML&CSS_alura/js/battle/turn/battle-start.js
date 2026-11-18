// Mantemencao da batalha: parte 60 (Organizada e Limpa)
async function startBattle() {
    if (onlineMode && !onlineTeamsLoading) {
        await submitOnlineTeam();
        return;
    }
    if (!validateTeams()) return;

    startButton.disabled = true;
    startButton.textContent = "Preparando...";
    setSetupMessage("Carregando golpes e regras de tipo...", false);
    
    try {
        // 1. Filtragem de slots válidos e seleção de golpes
        const activeTeams = pokemonTeams.map(team => team.filter(slot => slot && slot.pokemon));

        const chosenMoves = activeTeams.map((team, teamIndex) =>
            team.map((slot) => chooseMoves(slot, teamModes[pokemonTeams.indexOf(team)]))
        );
        
        // 2. Coleta e mapeamento de Mega Evoluções
        const megaForms = new Map(pokemonList.map((entry) => [entry.name, entry]));
        
        const selectedMegaNames = activeTeams.flatMap((team) =>
            team.map((slot) => slot.heldItem ? MEGA_STONES[slot.heldItem] : null).filter(Boolean)
        );
        
        const uniqueMegaNames = [...new Set(selectedMegaNames)];
        const megaDetails = await mapWithConcurrency(uniqueMegaNames, 6, async (name) => {
            const entry = megaForms.get(name);
            if (!entry) throw new Error(`Forma Mega indisponível: ${name}`);
            return [name, await api.getPokemon(entry.id)];
        });
        const megaPokemonByName = new Map(megaDetails);

        // 3. Verificação de elegibilidade para Eviolite
        const eviolitePokemon = activeTeams.flatMap((team) =>
            team.map((slot) => slot.heldItem === "eviolite" ? slot.pokemon : null).filter(Boolean)
        );
        
        const evioliteEligibility = await mapWithConcurrency(
            eviolitePokemon, 6, async (pokemon) => [pokemon.species.name, await isEvioliteEligible(pokemon)]
        );
        const evioliteEligibilityBySpecies = new Map(evioliteEligibility);
        
        // 4. Carregamento assíncrono de detalhes de golpes e tipos
        const allMoves = chosenMoves.reduce((all, team) => all.concat(...team), []);
        const uniqueMoveEntries = [...new Map(allMoves.map((entry) => [entry.move.url, entry])).values()];
        
        const typeNames = ALL_TYPE_NAMES;
        const missingTypeNames = typeNames.filter((type) => !typeDetailCache.has(type));
        
        const [moveDetails, typeDetails] = await Promise.all([
            mapWithConcurrency(uniqueMoveEntries, 8, ({ move }) => api.getMove(move.url)),
            mapWithConcurrency(missingTypeNames, 6, (type) => api.getType(type))
        ]);
        
        missingTypeNames.forEach((type, index) => typeDetailCache.set(type, typeDetails[index]));
        
        const moveDetailsByUrl = new Map(uniqueMoveEntries.map((entry, index) =>
            [entry.move.url, moveDetails[index]]
        ));
        const typeDetailsByName = new Map(typeNames.map((type) =>
            [type, typeDetailCache.get(type)]
        ));

        // 5. Construção estruturada das equipes de combate
        const teams = activeTeams.map((team, teamIndex) => ({
            name: playerNames[teamIndex]?.trim() || `Jogador ${teamIndex + 1}`,
            members: team.map((slot, slotIndex) => {
                const maxHp = calculateBattleHp(slot.pokemon);
                const moves = chosenMoves[teamIndex][slotIndex].map(({ move }) => {
                    const details = moveDetailsByUrl.get(move.url);
                    if (!details) throw new Error(`Dados indisponíveis para o golpe ${move.name}`);
                    return details;
                });
                
                return {
                    teamIndex,
                    entry: slot.entry,
                    pokemon: slot.pokemon,
                    basePokemon: slot.pokemon,
                    megaPokemon: slot.heldItem && MEGA_STONES[slot.heldItem]
                        ? megaPokemonByName.get(MEGA_STONES[slot.heldItem])
                        : null,
                    heldItem: slot.heldItem || null,
                    evioliteEligible: evioliteEligibilityBySpecies.get(slot.pokemon.species.name) || false,
                    megaEvolved: false,
                    originalTypes: slot.pokemon.types.map(({ type }) => type.name),
                    currentTypes: slot.pokemon.types.map(({ type }) => type.name),
                    moves,
                    originalMoves: [...moves],
                    maxHp,
                    currentHp: maxHp,
                    statStages: {},
                    criticalStage: 0,
                    status: null,
                    confusionTurns: 0,
                    flinchedTurn: null,
                    protectionChain: 0,
                    lastProtectionTurn: null,
                    protectedTurn: null,
                    enduredTurn: null,
                    moveEffects: {},
                    entryTurn: 1,
                    damageTakenThisTurn: 0,
                    lastDamageClassThisTurn: null
                };
            })
        }));

        // 6. Inicialização do estado global do jogo (`game`)
        const battleFormat = Number(document.querySelector("#battle-format").value);
        game = {
            format: battleFormat,
            teams,
            typeDetails: typeDetailsByName,
            active: [0, 1].map(() => Array.from(
                { length: battleFormat },
                (_, index) => index
            )),
            pendingActions: [[], []],
            pendingMega: new Set(),
            megaUsed: [false, false],
            pendingTarget: null,
            lastExecutedMove: null,
            currentPlayer: 0,
            turn: 1,
            log: ["A batalha começou!"],
            winner: null,
            visualEffects: null,
            fieldEffects: {
                trickRoomTurns: 0,
                tailwindTurns: [0, 0],
                wishes: [[], []],
                wideGuardTurn: [null, null],
                quickGuardTurn: [null, null],
                matBlockTurn: [null, null],
                weather: { name: null, turns: 0 },
                terrain: { name: null, turns: 0 },
                screens: {
                    reflect: [0, 0],
                    lightScreen: [0, 0],
                    auroraVeil: [0, 0]
                },
                safeguardTurns: [0, 0],
                mistTurns: [0, 0],
                luckyChantTurns: [0, 0],
                hazards: Array.from({ length: 2 }, () => ({
                    stealthRock: false,
                    spikes: 0,
                    toxicSpikes: 0,
                    stickyWeb: false
                })),
                gravityTurns: 0,
                wonderRoomTurns: 0,
                magicRoomTurns: 0,
                mudSportTurns: 0,
                waterSportTurns: 0,
                ionDelugeTurn: null,
                fairyLockTurn: null,
                craftyShieldToken: [null, null]
            },
            currentResolution: null
        };

        // 7. Configuração de flags online e transição de telas
        onlineBattleStarted = onlineMode;
        onlineBattleReady = false;
        onlineWaitingForState = onlineMode;
        renderedLogLength = 0;
        
        battleLog.replaceChildren();
        setupView.hidden = true;
        battleView.hidden = false;
        
        renderBattle();
        battleView.scrollIntoView({ behavior: "smooth", block: "start" });
        
    } catch (error) {
        console.error("Erro ao preparar a batalha:", error);
        onlineBattleStarted = false;
        setSetupMessage("Não foi possível preparar a batalha. Verifique a conexão e tente novamente.", true);
    } finally {
        startButton.disabled = false;
        updateOnlineLobby();
    }
}