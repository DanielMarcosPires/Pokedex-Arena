// Inicialização principal da Pokédex (Organizado e Limpo)
(() => {
    const { state, dom, api, catalog } = window.PokedexApp;
    const { searchInput, typeFilter, generationFilter, sortFilter, loadingState, errorState,
        resultCount, dialog } = dom;

    // 1. Carrega a lista inicial de Pokémon da API, atualiza contadores e renderiza a primeira página
    async function loadPokemonList() {
        loadingState.hidden = false;
        errorState.hidden = true;
        
        try {
            state.pokemonList = await api.getPokemonList();
            document.querySelector("#hero-count").textContent = state.pokemonList.length.toLocaleString("pt-BR");
            
            catalog.populateTypes();
            catalog.renderPage();
        } catch (error) {
            console.error("Erro ao carregar Pokédex:", error);
            loadingState.hidden = true;
            errorState.hidden = false;
            resultCount.textContent = "Falha ao carregar os dados";
        }
    }

    // 2. Event listener para busca por texto (com debounce para otimização de performance)
    searchInput.addEventListener("input", () => {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => {
            state.currentPage = 1;
            catalog.renderPage();
        }, 250);
    });

    // 3. Event listeners para alteração nos filtros de tipo, geração e ordenação
    [typeFilter, generationFilter, sortFilter].forEach((filter) => filter.addEventListener("change", () => {
        state.currentPage = 1;
        catalog.renderPage();
    }));

    // 4. Controles de paginação (Página Anterior / Próxima Página) com rolagem suave (smooth scroll)
    document.querySelector("#prev-page").addEventListener("click", () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            catalog.renderPage();
            document.querySelector("#catalogo").scrollIntoView({ behavior: "smooth" });
        }
    });

    document.querySelector("#next-page").addEventListener("click", () => {
        state.currentPage++;
        catalog.renderPage();
        document.querySelector("#catalogo").scrollIntoView({ behavior: "smooth" });
    });

    // 5. Botão para limpar todos os filtros aplicados e restaurar o catálogo padrão
    document.querySelector("#clear-filters").addEventListener("click", () => {
        searchInput.value = "";
        typeFilter.value = "";
        generationFilter.value = "";
        sortFilter.value = "number";
        state.currentPage = 1;
        catalog.renderPage();
    });

    // 6. Manipuladores de eventos para o modal de detalhes e atalhos de teclado (ex: tecla '/' para focar na busca)
    document.querySelector("#retry-button").addEventListener("click", loadPokemonList);
    document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
    
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
            event.preventDefault();
            searchInput.focus();
        }
    });

    // Inicializa a aplicação carregando os dados
    loadPokemonList();
})();