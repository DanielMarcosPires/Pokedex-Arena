// Módulo de catálogo e listagem da Pokédex (Organizado e Limpo)
window.PokedexApp.catalog = (() => {
    const { config, state, dom, api, details, utils } = window.PokedexApp;
    const { pageSize, typeNames } = config;
    const { 
        grid, searchInput, typeFilter, generationFilter, sortFilter, resultCount, loadingState,
        errorState, emptyState, pagination 
    } = dom;
    const { escapeHTML, formatName, generationFor, imageUrl, pokemonIdFromUrl, statTotal, typeLabel } = utils;

    // 1. Popula dinamicamente o elemento select de filtro de tipos com as opções traduzidas
    function populateTypes() {
        Object.entries(typeNames).forEach(([type, label]) => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = `Tipo ${label}`;
            typeFilter.append(option);
        });
    }

    // 2. Filtra a lista completa de Pokémon com base na busca por nome/ID, geração, tipo elemental e ordenação
    async function filteredPokemon() {
        let results = state.pokemonList;
        const query = searchInput.value.trim().toLowerCase();
        const idQuery = Number(query.replace(/^#/, ""));
        const generation = Number(generationFilter.value);

        if (query) {
            results = results.filter((pokemon) => 
                pokemon.name.includes(query) || (Number.isFinite(idQuery) && pokemon.id === idQuery)
            );
        }

        if (generation) {
            results = results.filter((pokemon) => generationFor(pokemon.id) === generation);
        }

        if (typeFilter.value) {
            const typeData = await api.getType(typeFilter.value);
            const matching = new Set(typeData.pokemon.map(({ pokemon }) => pokemonIdFromUrl(pokemon.url)));
            results = results.filter((pokemon) => matching.has(pokemon.id));
        }

        if (sortFilter.value === "name") {
            results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        }

        return results;
    }

    // 3. Constrói e retorna o elemento de cartão (card) interativo de um Pokémon para exibição no grid
    function renderCard(pokemon, detail) {
        const total = statTotal(detail);
        const button = document.createElement("button");
        
        button.className = "pokemon-card";
        button.type = "button";
        button.setAttribute("aria-label", `Ver detalhes de ${formatName(pokemon.name)}`);

        const typeTags = detail.types.map(({ type }) =>
            `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`
        ).join("");
        
        const artwork = escapeHTML(imageUrl(detail));

        button.innerHTML = `
            <div class="card-art">
                <span class="pokemon-number">#${String(pokemon.id).padStart(4, "0")}</span>
                <img src="${artwork}" alt="${formatName(pokemon.name)}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'">
            </div>
            <div class="card-info">
                <div class="card-name-row"><span class="card-name">${formatName(pokemon.name)}</span><span class="card-bst">BST ${total}</span></div>
                <div class="type-list">${typeTags}</div>
                <div class="card-stats">
                    <span class="card-stat-label">Total de atributos</span>
                    <span class="mini-stat-track"><span class="mini-stat-fill" style="display:block;width:${Math.min(total / 720 * 100, 100)}%"></span></span>
                    <span class="card-total">${total}</span>
                </div>
            </div>`;

        button.addEventListener("click", () => details.open(pokemon.id));
        return button;
    }

    // 4. Renderiza a página atual do catálogo, controlando paginação, carregamento assíncrono em lotes e estados visuais
    async function renderPage() {
        const version = ++state.requestVersion;
        
        loadingState.hidden = false;
        errorState.hidden = true;
        emptyState.hidden = true;
        pagination.hidden = true;
        grid.replaceChildren();

        try {
            const results = await filteredPokemon();
            if (version !== state.requestVersion) return;

            const pages = Math.max(1, Math.ceil(results.length / pageSize));
            state.currentPage = Math.min(state.currentPage, pages);
            
            const start = (state.currentPage - 1) * pageSize;
            const pageItems = results.slice(start, start + pageSize);
            
            const detailsList = await Promise.all(pageItems.map((pokemon) => api.getPokemon(pokemon.id)));
            if (version !== state.requestVersion) return;

            detailsList.forEach((detail, index) => grid.append(renderCard(pageItems[index], detail)));

            loadingState.hidden = true;
            emptyState.hidden = results.length !== 0;
            resultCount.textContent = `${results.length.toLocaleString("pt-BR")} Pokémon encontrado${results.length === 1 ? "" : "s"}`;
            
            pagination.hidden = results.length <= pageSize;
            document.querySelector("#page-label").textContent = `Página ${state.currentPage} de ${pages}`;
            document.querySelector("#prev-page").disabled = state.currentPage <= 1;
            document.querySelector("#next-page").disabled = state.currentPage >= pages;
            document.querySelector("#clear-filters").hidden = !searchInput.value && !typeFilter.value && !generationFilter.value;
        } catch (error) {
            if (version !== state.requestVersion) return;
            console.error("Erro ao filtrar ou carregar Pokémon:", error);
            loadingState.hidden = true;
            errorState.hidden = false;
            resultCount.textContent = "Não foi possível carregar os Pokémon";
        }
    }

    return { populateTypes, renderPage };
})();