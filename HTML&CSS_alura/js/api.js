window.PokedexApp.api = (() => {
    const { apiUrl } = window.PokedexApp.config;
    const { detailCache, typeCache, moveCache } = window.PokedexApp.state;
    const { pokemonIdFromUrl } = window.PokedexApp.utils;

    async function fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`PokéAPI respondeu ${response.status}`);
        return response.json();
    }

    async function getPokemonList() {
        const data = await fetchJson(`${apiUrl}/pokemon?limit=2000`);
        return data.results
            .map((pokemon) => ({ ...pokemon, id: pokemonIdFromUrl(pokemon.url) }))
            .filter((pokemon) => Number.isFinite(pokemon.id))
            .sort((a, b) => a.id - b.id);
    }

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
