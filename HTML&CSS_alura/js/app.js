(() => {
    const { state, dom, api, catalog } = window.PokedexApp;
    const { searchInput, typeFilter, generationFilter, sortFilter, loadingState, errorState,
        resultCount, dialog } = dom;

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

    searchInput.addEventListener("input", () => {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => {
            state.currentPage = 1;
            catalog.renderPage();
        }, 250);
    });

    [typeFilter, generationFilter, sortFilter].forEach((filter) => filter.addEventListener("change", () => {
        state.currentPage = 1;
        catalog.renderPage();
    }));

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

    document.querySelector("#clear-filters").addEventListener("click", () => {
        searchInput.value = "";
        typeFilter.value = "";
        generationFilter.value = "";
        sortFilter.value = "number";
        state.currentPage = 1;
        catalog.renderPage();
    });

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

    loadPokemonList();
})();
