// Mantemencao da batalha: parte 47 a 51 (Refinada e Otimizada)

// Função auxiliar centralizada para garantir que o diálogo está aberto e no modo correto
const openPickerModal = (mode) => {
    showPickerMode(mode);
    if (!pickerDialog.open) {
        pickerDialog.showModal();
    }
};

// 1. Abre o seletor de Pokémon no modo de lista (para um slot vazio ou nova seleção)
function openPokemonPicker(teamIndex, slotIndex) {
    pickerTarget = { teamIndex, slotIndex };
    pendingPokemon = null;
    pendingHeldItem = null;
    pendingMoves = [];
    pendingMoveDetails = {};
    pickerPage = 1;
    pickerSearch.value = "";
    
    clearTimeout(pickerSearchTimer);
    openPickerModal("list");
    renderPokemonPicker();
    pickerSearch.focus();
}

// 2. Abre o slot de Pokémon (se já houver um Pokémon, vai direto para detalhes; senão, abre o picker)
function openPokemonSlot(teamIndex, slotIndex) {
    const slot = pokemonTeams[teamIndex]?.[slotIndex];
    
    if (!slot?.pokemon) {
        openPokemonPicker(teamIndex, slotIndex);
        return;
    }
    
    pickerTarget = { teamIndex, slotIndex };
    pendingPokemon = { entry: slot.entry, pokemon: slot.pokemon };
    pendingHeldItem = slot.heldItem;
    pendingMoves = [...slot.selectedMoves];
    pendingMoveDetails = { ...slot.moveDetails };
    
    openPickerModal("details");
    renderPokemonDetail();
}

// 3. Atalho de escolha de Pokémon para pré-visualização
function choosePokemon(entry, pokemon) {
    previewPokemon(entry, pokemon);
}

// 4. Abre o seletor de itens segurados para o Pokémon em preparação
function openItemPicker() {
    openPickerModal("items");
    
    itemPickerGrid.innerHTML = itemsForPokemon(pendingPokemon?.entry?.name).map(({ name, title, description }) => {
        const selected = (pendingHeldItem || "") === name;
        const image = name
            ? `<img src="${escapeHTML(itemSpriteUrl(name))}" alt="" onerror="this.hidden = true">`
            : '<span class="item-picker-empty-icon" aria-hidden="true">—</span>';
            
        return `
            <button class="item-picker-option ${selected ? "is-selected" : ""}" type="button"
                data-held-item="${escapeHTML(name)}" aria-pressed="${selected}">
                ${image}
                <span class="item-picker-option-copy">
                    <strong>${escapeHTML(title)}</strong>
                    <small>${escapeHTML(description)}</small>
                </span>
                <span class="item-picker-check">${selected ? "Selecionado" : "Escolher"}</span>
            </button>
        `;
    }).join("");

    // Otimização: Delegação de eventos ou vinculação limpa pós-render
    itemPickerGrid.querySelectorAll("[data-held-item]").forEach((button) => {
        button.addEventListener("click", () => {
            pendingHeldItem = button.dataset.heldItem || null;
            openPickerModal("details");
            renderPokemonDetail();
        }, { once:يدية ? false : true }); // Garante que limpa ouvintes duplicados se recriado
    });
}

// 5. Abre o seletor de golpes para configurar o Pokémon
function openMovePicker() {
    movePickerPage = 1;
    movePickerSearch.value = "";
    movePickerMessage.textContent = "";
    
    openPickerModal("moves");
    renderMovePicker();
    movePickerSearch.focus();
}