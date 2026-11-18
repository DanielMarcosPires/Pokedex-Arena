// Mantemencao da batalha: parte 45 (Organizada e Limpa)
function renderPokemonDetail() {
    if (!pendingPokemon) return;
    
    const { entry, pokemon } = pendingPokemon;
    const statLabels = {
        hp: "HP",
        attack: "Ataque",
        defense: "Defesa",
        "special-attack": "Ataque especial",
        "special-defense": "Defesa especial",
        speed: "Velocidade"
    };

    // 1. Renderização de tipos e barras de atributos base
    const types = pokemon.types.map(({ type }) =>
        `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`
    ).join("");

    const stats = pokemon.stats.map(({ stat, base_stat }) => {
        const label = statLabels[stat.name] || stat.name.replace(/-/g, " ");
        const percentage = Math.min(255, Math.max(0, base_stat)) / 255 * 100;
        
        return `
            <div class="pokemon-base-stat-row">
                <span class="pokemon-base-stat-label">${escapeHTML(label)}</span>
                <div class="pokemon-base-stat-track" role="meter" aria-label="${escapeHTML(label)}"
                    aria-valuemin="0" aria-valuemax="255" aria-valuenow="${base_stat}">
                    <span style="width: ${percentage.toFixed(1)}%"></span>
                </div>
            </div>
        `;
    }).join("");

    // 2. Montagem do card de detalhes do Pokémon e item segurado
    pokemonDetailCard.innerHTML = `
        <div class="pokemon-detail-card">
            <div class="pokemon-detail-art">
                <img src="${escapeHTML(imageUrl(pokemon))}" alt="${formatName(entry.name)}">
            </div>
            <div class="pokemon-detail-info">
                <span class="pokemon-number">#${String(entry.id).padStart(4, "0")}</span>
                <div class="pokemon-detail-name-row">
                    <h3>${formatName(entry.name)}</h3>
                    <button class="held-item-slot" type="button" data-choose-held-item
                        aria-label="${pendingHeldItem ? `Trocar item ${plainName(pendingHeldItem.replace(/_/g, "-"))}` : "Escolher item"}">
                        ${pendingHeldItem
                            ? `<img src="${escapeHTML(itemSpriteUrl(pendingHeldItem))}" alt="" onerror="this.hidden = true">`
                            : '<span aria-hidden="true">+</span>'}
                    </button>
                </div>
                <div class="type-list">${types}</div>
                <p class="pokemon-base-chart-title">Atributos base</p>
                <div class="pokemon-detail-stats">${stats}</div>
            </div>
        </div>
    `;

    pokemonDetailCard.querySelector("[data-choose-held-item]").addEventListener("click", openItemPicker);

    // 3. Renderização dos botões de seleção de golpes
    pendingMoveButtons.innerHTML = Array.from({ length: 4 }, (_, index) => {
        const moveName = pendingMoves[index];
        const moveDetails = moveName ? pendingMoveDetails[moveName] : null;
        const moveType = moveDetails?.type?.name;

        return `
            <button class="pokemon-move-button${moveType ? "" : " is-empty"}" type="button" data-open-move-picker
                aria-label="${moveName ? `Editar golpe ${index + 1}: ${plainName(moveName)}` : `Escolher golpe ${index + 1}`}">
                <span class="pokemon-move-slot-label">Golpe ${index + 1}</span>
                <strong>${moveName ? formatName(moveName) : "Escolher golpe"}</strong>
                ${moveType ? `<span class="type-tag type-${escapeHTML(moveType)}">${typeLabel(moveType)}</span>` : ""}
            </button>
        `;
    }).join("");

    pendingMoveButtons.querySelectorAll("[data-open-move-picker]").forEach((button) => {
        button.addEventListener("click", openMovePicker);
    });

    // 4. Validação e estado do botão de confirmação/ salvamento
    const canConfirm = teamModes[pickerTarget.teamIndex] !== "manual" || pendingMoves.length === 4;
    const currentSelection = pokemonTeams[pickerTarget.teamIndex][pickerTarget.slotIndex];
    const confirmButton = document.querySelector("#confirm-pokemon-selection");

    confirmButton.disabled = !canConfirm;
    confirmButton.textContent = currentSelection ? "Salvar configuração" : "Adicionar ao time";
    
    pokemonDetailMessage.textContent = canConfirm
        ? ""
        : "No modo manual, escolha quatro golpes antes de adicionar o Pokémon.";
}


// Mantemencao da batalha: parte 46 (Organizada e Limpa)
function previewPokemon(entry, pokemon) {
    if (!pickerTarget) return;
    
    const currentSlot = pokemonTeams[pickerTarget.teamIndex][pickerTarget.slotIndex];
    const isCurrentSelection = currentSlot?.entry.id === entry.id;
    
    pendingPokemon = { entry, pokemon };
    pendingHeldItem = isCurrentSelection ? currentSlot.heldItem : null;
    pendingMoves = isCurrentSelection ? [...currentSlot.selectedMoves] : [];
    pendingMoveDetails = isCurrentSelection ? { ...currentSlot.moveDetails } : {};
    
    pokemonDetailMessage.textContent = "";
    showPickerMode("details");
    renderPokemonDetail();
}