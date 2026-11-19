// Módulo de requisições à PokéAPI com cache em memória (Organizado e Limpo)
window.PokedexApp.api = (() => {
    const { apiUrl } = window.PokedexApp.config;
    const { detailCache, typeCache, moveCache } = window.PokedexApp.state;
    const { pokemonIdFromUrl } = window.PokedexApp.utils;

    // 1. Função utilitária genérica para requisições HTTP e conversão para JSON com tratamento de erros
    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`PokéAPI respondeu ${response.status}`);
        return response.json();
    }

    // 2. Busca a lista completa de todos os Pokémon disponíveis na PokéAPI, extraindo IDs e ordenando numericamente
    async function getPokemonList() {
        const data = await fetchJson(`${apiUrl}/pokemon?limit=2000`);
        return data.results
            .map((pokemon) => ({ ...pokemon, id: pokemonIdFromUrl(pokemon.url) }))
            .filter((pokemon) => Number.isFinite(pokemon.id))
            .sort((a, b) => a.id - b.id);
    }

    // 3. Obtém os detalhes completos de um Pokémon pelo ID ou URL, utilizando cache em memória para otimização
    async function getPokemon(id) {
        if (!detailCache.has(id)) {
            detailCache.set(id, fetchJson(`${apiUrl}/pokemon/${id}`));
        }
        try {
            return await detailCache.get(id);
        } catch (error) {
            detailCache.delete(id);
            throw error;
        }
    }

    // 4. Obtém os dados de um tipo elemental específico (relações de dano e lista de Pokémon pertencentes) com cache
    async function getType(type) {
        if (!typeCache.has(type)) {
            typeCache.set(type, fetchJson(`${apiUrl}/type/${type}`));
        }
        try {
            return await typeCache.get(type);
        } catch (error) {
            typeCache.delete(type);
            throw error;
        }
    }

    // 5. Obtém os detalhes de um golpe específico por URL, utilizando cache para evitar requisições duplicadas
    async function getMove(url) {
        if (!moveCache.has(url)) {
            moveCache.set(url, fetchJson(url));
        }
        try {
            return await moveCache.get(url);
        } catch (error) {
            moveCache.delete(url);
            throw error;
        }
    }

    return { getPokemonList, getPokemon, getType, getMove, fetchJson };
})();