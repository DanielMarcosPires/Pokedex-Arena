// Mantemencao da batalha: parte 52 (Organizada e Limpa)
async function renderMovePicker() {
    if (pickerMode !== "moves" || !pendingPokemon) return;
    
    const requestVersion = ++movePickerRequestVersion;
    const query = movePickerSearch.value.trim().toLowerCase();
    const allMoves = uniqueMoves(pendingPokemon.pokemon.moves);
    
    // 1. Filtragem por busca
    const results = allMoves.filter(({ move }) => !query || move.name.includes(query));
    
    // 2. Configuração de paginação
    const pageSize = window.PokedexApp.config.pageSize;
    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    movePickerPage = Math.min(movePickerPage, pageCount);
    const pageItems = results.slice((movePickerPage - 1) * pageSize, movePickerPage * pageSize);
    
    // 3. Atualização visual inicial dos controles e status
    movePickerList.replaceChildren();
    movePickerPagination.hidden = results.length <= pageSize;
    movePickerPrev.disabled = movePickerPage <= 1;
    movePickerNext.disabled = movePickerPage >= pageCount;
    movePickerPageLabel.textContent = `Página ${movePickerPage} de ${pageCount}`;
    movePickerConfirm.textContent = `Concluir escolha (${pendingMoves.length}/4)`;
    movePickerConfirm.disabled = pendingMoves.length !== 4;
    movePickerMessage.textContent = "";

    if (!results.length) {
        movePickerCount.textContent = "Nenhum golpe encontrado.";
        return;
    }

    movePickerCount.textContent = `Carregando golpes... ${pendingMoves.length}/4 selecionados`;

    try {
        // 4. Carregamento assíncrono em lotes dos detalhes dos golpes
        const details = await mapWithConcurrency(pageItems, 6, ({ move }) => api.getMove(move.url));
        
        if (requestVersion !== movePickerRequestVersion || pickerMode !== "moves") return;
        
        pageItems.forEach((entry, index) => {
            const detailsForMove = details[index];
            const moveName = entry.move.name;
            
            if (pendingMoves.includes(moveName)) {
                pendingMoveDetails[moveName] = detailsForMove;
            }
            
            const selected = pendingMoves.includes(moveName);
            const button = document.createElement("button");
            
            button.type = "button";
            button.className = `move-picker-option ${selected ? "is-selected" : ""}`;
            button.setAttribute("aria-pressed", String(selected));
            button.innerHTML = `
                <span class="move-picker-option-state">${selected ? "✓" : "+"}</span>
                ${renderMovePreview(detailsForMove)}
            `;
            
            // Evento de clique para alternar seleção do golpe (máximo 4)
            button.addEventListener("click", () => {
                const selectedIndex = pendingMoves.indexOf(moveName);
                
                if (selectedIndex >= 0) {
                    pendingMoves.splice(selectedIndex, 1);
                } else if (pendingMoves.length >= 4) {
                    movePickerMessage.textContent = "Você já selecionou quatro golpes. Remova um antes de escolher outro.";
                    return;
                } else {
                    pendingMoves.push(moveName);
                }
                
                pendingMoveDetails[moveName] = detailsForMove;
                renderPokemonDetail();
                renderMovePicker();
            });
            
            movePickerList.append(button);
        });

        movePickerCount.textContent = `${results.length.toLocaleString("pt-BR")} golpes disponíveis · ${pendingMoves.length}/4 selecionados`;
        movePickerConfirm.textContent = `Concluir escolha (${pendingMoves.length}/4)`;
        movePickerConfirm.disabled = pendingMoves.length !== 4;
        
    } catch (error) {
        if (requestVersion !== movePickerRequestVersion) return;
        console.error(`Erro ao carregar golpes de ${pendingPokemon.entry.name}:`, error);
        movePickerCount.textContent = "Não foi possível carregar os detalhes dos golpes.";
        movePickerMessage.textContent = "Verifique sua conexão e tente novamente.";
    }
}


// Mantemencao da batalha: parte 53 (Organizada e Limpa)
function confirmMoveSelection() {
    if (pendingMoves.length !== 4) {
        movePickerMessage.textContent = "Escolha exatamente quatro golpes para continuar.";
        return;
    }
    showPickerMode("details");
    renderPokemonDetail();
}


// Mantemencao da batalha: parte 54 (Organizada e Limpa)
function confirmPokemonSelection() {
    if (!pickerTarget || !pendingPokemon) return;
    
    if (teamModes[pickerTarget.teamIndex] === "manual" && pendingMoves.length !== 4) {
        pokemonDetailMessage.textContent = "Escolha quatro golpes antes de adicionar o Pokémon ao time.";
        return;
    }
    
    const { teamIndex, slotIndex } = pickerTarget;
    const selection = {
        ...pendingPokemon,
        heldItem: pendingHeldItem,
        selectedMoves: pendingMoves,
        moveDetails: pendingMoveDetails
    };
    
    pickerDialog.close();
    selectPokemon(teamIndex, slotIndex, selection);
}