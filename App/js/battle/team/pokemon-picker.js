// Mantemencao da batalha: parte 42 (Organizada e Limpa)
function renderPickerCard(entry, pokemon) {
    const target = pickerTarget;
    const selected = pokemonTeams[target.teamIndex][target.slotIndex]?.entry.id === entry.id;
    const alreadyInTeam = pokemonTeams[target.teamIndex].some((slot, index) =>
        index !== target.slotIndex && slot?.entry.id === entry.id
    );
    
    const button = document.createElement("button");
    const types = pokemon.types.map(({ type }) =>
        `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`
    ).join("");
    
    const status = selected ? "Neste espaço" : alreadyInTeam ? "Já está no time" : "Selecionar";
    
    button.type = "button";
    button.className = `pokemon-card picker-pokemon-card${selected ? " is-current" : ""}`;
    button.disabled = alreadyInTeam;
    button.setAttribute("aria-label", `${alreadyInTeam ? "Já está no time: " : "Selecionar "}${formatName(entry.name)}`);
    button.setAttribute("aria-pressed", String(selected));
    
    button.innerHTML = `
        <div class="card-art">
            <span class="pokemon-number">#${String(entry.id).padStart(4, "0")}</span>
            <span class="picker-card-status">${status}</span>
            <img src="${escapeHTML(imageUrl(pokemon))}" alt="" loading="lazy"
                onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png'">
        </div>
        <div class="card-info">
            <div class="card-name-row">
                <span class="card-name">${formatName(entry.name)}</span>
                <span class="card-bst">BST ${statTotal(pokemon)}</span>
            </div>
            <div class="type-list">${types}</div>
        </div>`;
        
    button.addEventListener("click", () => choosePokemon(entry, pokemon));
    return button;
}


// Mantemencao da batalha: parte 43 (Organizada e Limpa)
async function renderPokemonPicker() {
    if (pickerMode !== "list") return;
    
    const requestVersion = ++pickerRequestVersion;
    const query = pickerSearch.value.trim().toLowerCase();
    const idQuery = Number(query.replace(/^#/, ""));
    const selectedGeneration = Number(pickerGeneration.value);
    
    // 1. Filtragem por busca (nome/ID) e geração
    const results = pokemonList.filter((pokemon) => 
        isSelectablePokemon(pokemon) &&
        (!query || pokemon.name.includes(query) || (Number.isFinite(idQuery) && pokemon.id === idQuery)) &&
        (!selectedGeneration || utils.generationFor(pokemon.id) === selectedGeneration)
    );
    
    // 2. Configuração de paginação
    const pageSize = window.PokedexApp.config.pageSize;
    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    pickerPage = Math.min(pickerPage, pageCount);
    const start = (pickerPage - 1) * pageSize;
    const pageItems = results.slice(start, start + pageSize);

    // 3. Atualização visual de controles e botões de página
    pickerGrid.replaceChildren();
    pickerRetry.hidden = true;
    pickerPagination.hidden = results.length <= pageSize;
    pickerPrev.disabled = pickerPage <= 1;
    pickerNext.disabled = pickerPage >= pageCount;
    pickerPageLabel.textContent = `Página ${pickerPage} de ${pageCount}`;

    if (!results.length) {
        pickerCount.textContent = "Nenhum Pokémon encontrado.";
        return;
    }

    pickerCount.textContent = "Carregando Pokémon...";
    
    try {
        // 4. Carregamento assíncrono dos detalhes dos itens da página atual
        const details = await Promise.all(pageItems.map(({ id }) => api.getPokemon(id)));
        
        if (requestVersion !== pickerRequestVersion || !pickerTarget) return;
        
        pageItems.forEach((entry, index) => pickerGrid.append(renderPickerCard(entry, details[index])));
        pickerCount.textContent = `${results.length.toLocaleString("pt-BR")} Pokémon encontrados.`;
    } catch (error) {
        if (requestVersion !== pickerRequestVersion) return;
        console.error("Erro ao carregar a página da Pokédex:", error);
        pickerCount.textContent = "Não foi possível carregar estes Pokémon.";
        pickerRetry.hidden = false;
    }
}


// Mantemencao da batalha: parte 44 (Organizada e Limpa)
function showPickerMode(mode) {
    pickerMode = mode;
    
    // Controle de visibilidade das views do modal
    pokemonListView.hidden = mode !== "list";
    pokemonDetailView.hidden = mode !== "details";
    itemPickerView.hidden = mode !== "items";
    movePickerView.hidden = mode !== "moves";
    
    const titles = {
        list: "Escolher Pokémon",
        details: "Preparar Pokémon",
        items: "Escolher item",
        moves: "Escolher golpes"
    };
    
    const contexts = {
        list: "Selecione um Pokémon para configurar seu time.",
        details: "Confira o Pokémon e defina item e golpes.",
        items: "Escolha o item que este Pokémon vai segurar.",
        moves: "Selecione quatro golpes para este Pokémon."
    };
    
    pickerTitle.textContent = titles[mode];
    pickerContext.textContent = contexts[mode];
}