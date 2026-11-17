window.PokedexApp.utils = (() => {
    const { generations, typeNames } = window.PokedexApp.config;

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatName(name) {
        return escapeHTML(name.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
    }

    function pokemonIdFromUrl(url) {
        return Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1]);
    }

    function generationFor(id) {
        return generations.findIndex(([first, last]) => id >= first && id <= last) + 1;
    }

    function typeLabel(type) {
        return escapeHTML(typeNames[type] || type);
    }

    function imageUrl(pokemon) {
        return pokemon.sprites?.other?.["official-artwork"]?.front_default
            || pokemon.sprites?.front_default
            || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    }

    function statTotal(pokemon) {
        return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
    }

    return { escapeHTML, formatName, pokemonIdFromUrl, generationFor, typeLabel, imageUrl, statTotal };
})();
