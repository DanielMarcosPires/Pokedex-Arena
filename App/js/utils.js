// Utilitários globais da aplicação Pokedex (Organizado e Limpo)
window.PokedexApp.utils = (() => {
    const { generations, typeNames } = window.PokedexApp.config;

    // 1. Escapa caracteres especiais para prevenir vulnerabilidades de XSS em inserções HTML
    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    // 2. Formata nomes formatando hífens como espaços e capitalizando as iniciais de cada palavra
    function formatName(name) {
        return escapeHTML(name.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));
    }

    // 3. Extrai o ID numérico do Pokémon a partir de sua URL da PokeAPI
    function pokemonIdFromUrl(url) {
        return Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1]);
    }

    // 4. Identifica a qual geração o Pokémon pertence com base no seu ID e nos intervalos definidos na configuração
    function generationFor(id) {
        return generations.findIndex(([first, last]) => id >= first && id <= last) + 1;
    }

    // 5. Retorna o rótulo traduzido ou formatado de um tipo elemental
    function typeLabel(type) {
        return escapeHTML(typeNames[type] || type);
    }

    // 6. Retorna a URL da melhor arte oficial disponível para o Pokémon (fallback para sprite padrão ou repositório oficial)
    function imageUrl(pokemon) {
        return pokemon.sprites?.other?.["official-artwork"]?.front_default
            || pokemon.sprites?.front_default
            || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    }

    // 7. Calcula a soma total de todos os atributos base (Base Stats) de um Pokémon
    function statTotal(pokemon) {
        return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
    }

    return { escapeHTML, formatName, pokemonIdFromUrl, generationFor, typeLabel, imageUrl, statTotal };
})();