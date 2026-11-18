// Configurações globais da aplicação Pokedex (Organizado e Limpo)
window.PokedexApp = window.PokedexApp || {};

window.PokedexApp.config = {
    // URL base da PokéAPI para requisições de dados
    apiUrl: "https://pokeapi.co/api/v2",
    
    // Quantidade padrão de itens exibidos por página nas listagens
    pageSize: 24,
    
    // Tradução e rotulação oficial dos tipos elementais para o português
    typeNames: {
        normal: "normal", 
        fire: "fogo", 
        water: "água", 
        electric: "elétrico", 
        grass: "grama",
        ice: "gelo", 
        fighting: "lutador", 
        poison: "veneno", 
        ground: "terra", 
        flying: "voador",
        psychic: "psíquico", 
        bug: "inseto", 
        rock: "pedra", 
        ghost: "fantasma", 
        dragon: "dragão",
        dark: "noturno", 
        steel: "aço", 
        fairy: "fada"
    },
    
    // Tradução e abreviação dos nomes dos atributos base (Base Stats)
    statNames: {
        hp: "HP", 
        attack: "Ataque", 
        defense: "Defesa", 
        "special-attack": "Atq. especial",
        "special-defense": "Def. especial", 
        speed: "Velocidade"
    },
    
    // Intervalos numéricos de IDs de Pokémon correspondentes a cada geração (da 1ª à 9ª)
    generations: [
        [1, 151], 
        [152, 251], 
        [252, 386], 
        [387, 493], 
        [494, 649],
        [650, 721], 
        [722, 809], 
        [810, 905], 
        [906, 1025]
    ]
};