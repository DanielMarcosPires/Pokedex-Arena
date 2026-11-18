// Mantemencao da batalha: parte 137 (Organizada e Limpa)
    async function loadPokemonList() {
        startButton.disabled = true;
        setSetupMessage("Carregando Pokémon disponíveis...", false);
        try {
            pokemonList = await api.getPokemonList();
            renderTeamBuilder();
            startButton.disabled = false;
            const selectableCount = pokemonList.filter(isSelectablePokemon).length;
            setSetupMessage(`${selectableCount.toLocaleString("pt-BR")} Pokémon disponíveis para seleção.`, false);
        } catch (error) {
            console.error("Erro ao carregar opções de Pokémon para a batalha:", error);
            setupMessage.innerHTML = 'Não foi possível carregar a lista de Pokémon. <button class="retry-pokemon" type="button">Tentar novamente</button>';
            setupMessage.classList.add("error");
            setupMessage.querySelector(".retry-pokemon").addEventListener("click", loadPokemonList);
        }
    }

    // --- 1. Eventos do Campo de Batalha (Arena) ---
    battlefield.addEventListener("click", (event) => {
        const pokemonCard = event.target.closest(".arena-pokemon.is-targetable");
        if (pokemonCard) registerBattleTarget(pokemonCard);
    });
    
    battlefield.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const pokemonCard = event.target.closest(".arena-pokemon.is-targetable");
        if (!pokemonCard) return;
        event.preventDefault();
        registerBattleTarget(pokemonCard);
    });

    // --- 2. Gerenciamento de Diálogos e Modais ---
    document.querySelector("#pokemon-picker-close").addEventListener("click", () => pickerDialog.close());
    
    document.querySelector("#switch-picker-close").addEventListener("click", () => {
        if (!switchTarget?.forced) switchDialog.close();
    });

    pickerDialog.addEventListener("close", () => {
        clearTimeout(pickerSearchTimer);
        clearTimeout(movePickerSearchTimer);
        pickerRequestVersion++;
        movePickerRequestVersion++;
        pickerTarget = null;
        pendingPokemon = null;
        pendingHeldItem = null;
        pendingMoves = [];
        pendingMoveDetails = {};
    });

    switchDialog.addEventListener("close", () => {
        if (!switchDialog.open) switchTarget = null;
    });

    switchDialog.addEventListener("cancel", (event) => {
        if (switchTarget?.forced) event.preventDefault();
    });

    // --- 3. Navegação do Construtor de Equipe e Pickers ---
    document.querySelector("#pokemon-detail-back").addEventListener("click", () => {
        showPickerMode("list");
        renderPokemonPicker();
    });
    
    document.querySelector("#confirm-pokemon-selection").addEventListener("click", confirmPokemonSelection);
    
    document.querySelector("#item-picker-back").addEventListener("click", () => {
        showPickerMode("details");
        renderPokemonDetail();
    });
    
    document.querySelector("#move-picker-back").addEventListener("click", () => {
        showPickerMode("details");
        renderPokemonDetail();
    });
    
    movePickerConfirm.addEventListener("click", confirmMoveSelection);

    // --- 4. Buscas e Paginações ---
    pickerSearch.addEventListener("input", () => {
        clearTimeout(pickerSearchTimer);
        pickerSearchTimer = setTimeout(() => {
            pickerPage = 1;
            renderPokemonPicker();
        }, 180);
    });

    pickerGeneration.addEventListener("change", () => {
        pickerPage = 1;
        renderPokemonPicker();
    });

    movePickerSearch.addEventListener("input", () => {
        clearTimeout(movePickerSearchTimer);
        movePickerSearchTimer = setTimeout(() => {
            movePickerPage = 1;
            renderMovePicker();
        }, 180);
    });

    movePickerPrev.addEventListener("click", () => {
        if (movePickerPage <= 1) return;
        movePickerPage--;
        renderMovePicker();
    });

    movePickerNext.addEventListener("click", () => {
        movePickerPage++;
        renderMovePicker();
    });

    pickerPrev.addEventListener("click", () => {
        if (pickerPage <= 1) return;
        pickerPage--;
        renderPokemonPicker();
    });

    pickerNext.addEventListener("click", () => {
        pickerPage++;
        renderPokemonPicker();
    });

    pickerRetry.addEventListener("click", renderPokemonPicker);

    // --- 5. Controles de Áudio ---
    battleMusicButton.addEventListener("click", () => {
        if (battleMusicEnabled) {
            stopBattleMusic();
            battleAudioStatus.textContent = "Música de batalha desativada.";
        } else {
            startBattleMusic();
        }
    });

    battleSfxButton.addEventListener("click", () => {
        soundEffectsEnabled = !soundEffectsEnabled;
        if (soundEffectsEnabled) {
            getAudioContext();
            battleAudioStatus.textContent = "Efeitos sonoros ativados.";
        } else {
            battleAudioStatus.textContent = "Efeitos sonoros desativados.";
        }
        updateBattleAudioControls();
    });

    // --- 6. Modo Online e Inicialização ---
    createOnlineRoomButton.addEventListener("click", createOnlineRoom);
    joinOnlineRoomButton.addEventListener("click", joinOnlineRoom);
    copyOnlineRoomButton.addEventListener("click", copyOnlineInvite);
    leaveOnlineRoomButton.addEventListener("click", leaveOnlineRoom);
    
    onlineRoomInput.addEventListener("input", () => {
        onlineRoomInput.value = onlineRoomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    });

    startButton.addEventListener("click", startBattle);
    document.querySelector("#edit-teams").addEventListener("click", returnToSetup);

    // Inicialização da aplicação
    loadPokemonList();

    window.PokedexApp.battle = { loadPokemonList };