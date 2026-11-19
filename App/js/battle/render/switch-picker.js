// Mantemencao da batalha: parte 72 (Organizada e Limpa)
function openSwitchPicker(teamIndex, activeSlot, forced = false, moveName = "", onChosen = null) {
    const currentIndex = game.active[teamIndex][activeSlot];
    
    // 1. Validação inicial se a troca é permitida
    if (currentIndex === null && !forced) return;
    
    const currentMember = currentIndex === null ? null : game.teams[teamIndex].members[currentIndex];
    
    if (!forced && currentMember && !canVoluntarilySwitch(currentMember)) {
        game.log.push(`${plainName(currentMember.entry.name)} não pode ser trocado agora.`);
        renderBattle();
        return;
    }

    // 2. Configuração do alvo da troca e obtenção de reservas disponíveis
    switchTarget = { teamIndex, activeSlot, forced, moveName, onChosen };
    const current = currentMember;
    const available = getAvailableSwitches(teamIndex);

    // 3. Definição do texto contextual com base no tipo de troca (forçada ou voluntária)
    const contextText = forced
        ? moveName
            ? `${formatName(moveName)} exige uma troca após o golpe. Escolha o Pokémon que entrará.`
            : "Escolha uma reserva para continuar. Essa substituição não consome a ação do próximo turno."
        : `Escolha quem entrará no lugar de ${plainName(current.entry.name)}. A troca consome a ação deste turno.`;
        
    document.querySelector("#switch-picker-context").textContent = contextText;

    // 4. Renderização da lista de opções de reserva ou mensagem de indisponibilidade
    if (!available.length) {
        switchPickerList.innerHTML = '<p class="switch-picker-empty">Não há Pokémon reservas disponíveis para esta troca.</p>';
    } else {
        switchPickerList.innerHTML = available.map(({ member, index }) => {
            const types = getMemberTypeNames(member)
                .map((type) => `<span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>`)
                .join("") || '<span class="type-tag">Sem tipo</span>';

            return `
                <button class="switch-choice" type="button" data-switch-to="${index}">
                    <img src="${escapeHTML(imageUrl(member.pokemon))}" alt="">
                    <span class="switch-choice-info">
                        <strong>#${String(member.entry.id).padStart(4, "0")} ${formatName(member.entry.name)}</strong>
                        <span class="switch-choice-types">${types}</span>
                        <span class="switch-choice-hp">${member.currentHp}/${member.maxHp} HP</span>
                    </span>
                    <span class="switch-choice-label">Escolher</span>
                </button>
            `;
        }).join("");

        // Registro de eventos de clique para cada opção de reserva
        switchPickerList.querySelectorAll("[data-switch-to]").forEach((button) => {
            button.addEventListener("click", () => chooseSwitchPokemon(Number(button.dataset.switchTo)));
        });
    }

    switchDialog.showModal();
}