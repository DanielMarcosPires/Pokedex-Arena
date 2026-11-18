// Mantemencao da batalha: parte 47 a 51 (Organizadas e Limpas)

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
    showPickerMode("list");
    pickerDialog.showModal();
    renderPokemonPicker();
    pickerSearch.focus();
}

// 2. Abre o slot de Pokémon (se já houver um Pokémon, vai direto para detalhes; senão, abre o picker)
function openPokemonSlot(teamIndex, slotIndex) {
    const slot = pokemonTeams[teamIndex][slotIndex];
    
    if (!slot?.pokemon) {
        openPokemonPicker(teamIndex, slotIndex);
        return;
    }
    
    pickerTarget = { teamIndex, slotIndex };
    pendingPokemon = { entry: slot.entry, pokemon: slot.pokemon };
    pendingHeldItem = slot.heldItem;
    pendingMoves = [...slot.selectedMoves];
    pendingMoveDetails = { ...slot.moveDetails };
    
    showPickerMode("details");
    pickerDialog.showModal();
    renderPokemonDetail();
}

// 3. Atalho de escolha de Pokémon para pré-visualização
function choosePokemon(entry, pokemon) {
    previewPokemon(entry, pokemon);
}

// 4. Abre o seletor de itens segurados para o Pokémon em preparação
function openItemPicker() {
    showPickerMode("items");
    
    itemPickerGrid.innerHTML = itemsForPokemon(pendingPokemon.entry.name).map(({ name, title, description }) => {
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

    itemPickerGrid.querySelectorAll("[data-held-item]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = button.dataset.heldItem || null;
            pendingHeldItem = item;
            showPickerMode("details");
            renderPokemonDetail();
        });
    });
}

// 5. Abre o seletor de golpes para configurar o Pokémon
function openMovePicker() {
    movePickerPage = 1;
    movePickerSearch.value = "";
    movePickerMessage.textContent = "";
    
    showPickerMode("moves");
    
    if (!pickerDialog.open) pickerDialog.showModal();
    
    renderMovePicker();
    movePickerSearch.focus();
}