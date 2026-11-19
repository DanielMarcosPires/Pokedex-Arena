// Mantemencao da batalha: parte 38 (Organizada e Limpa)
function renderSlot(slot, teamIndex, slotIndex) {
    const selection = slot?.entry;
    const heldItem = slot?.heldItem || "";
    const isDisabled = teamRandomizing[teamIndex] || onlineTeamSubmitted ? "disabled" : "";

    // 1. Slot Preenchido (Pokémon selecionado e carregado)
    if (selection && slot.pokemon) {
        const types = slot.pokemon.types.map(({ type }) =>
            `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`
        ).join("");

        const heldItemSlot = heldItem
            ? `<span class="team-slot-held-item">
                <img src="${escapeHTML(itemSpriteUrl(heldItem))}"
                    alt="${escapeHTML(formatName(heldItem.replace(/_/g, "-")))}"
                    onerror="this.hidden = true">
               </span>`
            : '<span class="team-slot-held-item" aria-label="Sem item segurado"><span aria-hidden="true">+</span></span>';

        return `
            <button class="team-slot" type="button"
                aria-label="Editar ${formatName(selection.name)}"
                data-team="${teamIndex}" data-slot="${slotIndex}" ${isDisabled}>
                <span class="team-slot-content">
                    <span class="slot-pokemon-art">
                        <img src="${escapeHTML(imageUrl(slot.pokemon))}" alt="">
                    </span>
                    <span class="team-slot-info">
                        ${heldItemSlot}
                        <span class="team-slot-title">${formatName(selection.name)}</span>
                        <span class="slot-types">${types}</span>
                    </span>
                </span>
            </button>
        `;
    }

    // 2. Slot Vazio ou em Estado de Carregamento/Falha
    let preview = '<div class="slot-preview-placeholder">Nenhum Pokémon selecionado</div>';
    let slotStatus = "Vaga livre";

    if (selection && slot.loading) {
        preview = '<div class="slot-loading">Carregando dados do Pokémon...</div>';
        slotStatus = "Carregando";
    } else if (selection) {
        preview = '<div class="slot-loading">Falha ao carregar. Selecione novamente para tentar outra vez.</div>';
        slotStatus = "Falha ao carregar";
    }

    const slotTitle = selection && slot.pokemon ? formatName(selection.name) : `Pokémon ${slotIndex + 1}`;
    const ariaLabel = selection ? `Editar ${formatName(selection.name)}` : `Escolher Pokémon ${slotIndex + 1} para o Time ${teamIndex + 1}`;

    return `
        <button class="team-slot is-empty" type="button"
            aria-label="${ariaLabel}"
            data-team="${teamIndex}" data-slot="${slotIndex}" ${isDisabled}>
            <div class="team-slot-heading">
                <span class="team-slot-title">${slotTitle}</span>
                <span class="team-slot-status">${slotStatus}</span>
            </div>
            ${preview}
        </button>
    `;
}