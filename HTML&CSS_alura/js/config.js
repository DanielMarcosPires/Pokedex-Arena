window.PokedexApp = window.PokedexApp || {};
window.PokedexApp.config = {
    apiUrl: "https://pokeapi.co/api/v2",
    pageSize: 24,
    typeNames: {
        normal: "normal", fire: "fogo", water: "água", electric: "elétrico", grass: "grama",
        ice: "gelo", fighting: "lutador", poison: "veneno", ground: "terra", flying: "voador",
        psychic: "psíquico", bug: "inseto", rock: "pedra", ghost: "fantasma", dragon: "dragão",
        dark: "noturno", steel: "aço", fairy: "fada"
    },
    statNames: {
        hp: "HP", attack: "Ataque", defense: "Defesa", "special-attack": "Atq. especial",
        "special-defense": "Def. especial", speed: "Velocidade"
    },
    generations: [
        [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
        [650, 721], [722, 809], [810, 905], [906, 1025]
    ]
};
