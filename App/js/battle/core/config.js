// Dados estáticos da batalha. (Organizado e Limpo)
// Edite este arquivo para alterar itens segurados, Mega Evoluções e conjuntos de golpes especiais.
window.PokedexApp.battleConfig = (() => {
    // Tipos elementais oficiais do universo Pokémon
    const ALL_TYPE_NAMES = [
        "normal",
        "fire",
        "water",
        "electric",
        "grass",
        "ice",
        "fighting",
        "poison",
        "ground",
        "flying",
        "psychic",
        "bug",
        "rock",
        "ghost",
        "dragon",
        "dark",
        "steel",
        "fairy"
    ];

    // Golpes que realizam troca do usuário após o uso (ex: U-turn, Volt Switch)
    const SWITCHING_MOVES = new Set([
        "volt-switch",
        "u-turn",
        "flip-turn",
        "parting-shot",
        "baton-pass",
        "chilly-reception",
        "shed-tail",
        "teleport"
    ]);

    // Golpes de proteção individual (Protect, Detect, Max Guard)
    const PERSONAL_PROTECTION_MOVES = new Set([
        "protect",
        "detect",
        "max-guard"
    ]);

    // Golpes de proteção em área para a equipe (Wide Guard, Quick Guard, Mat Block)
    const TEAM_PROTECTION_MOVES = new Set([
        "wide-guard",
        "quick-guard",
        "mat-block"
    ]);

    // Conjunto completo de movimentos de proteção e resistência (Endure incluído)
    const PROTECTION_MOVES = new Set([
        ...PERSONAL_PROTECTION_MOVES,
        ...TEAM_PROTECTION_MOVES,
        "endure"
    ]);

    // Golpes que ignoram barreiras e proteções (Feint, Phantom Force, etc.)
    const PROTECTION_BYPASS_MOVES = new Set([
        "feint",
        "hyperspace-fury",
        "hyperspace-hole",
        "phantom-force",
        "shadow-force",
        "g-max-one-blow"
    ]);

    // Golpes classificados como sonoros (afetados por Throat Chop, Soundproof, etc.)
    const SOUND_MOVES = new Set([
        "boomburst",
        "bug-buzz",
        "chatter",
        "clangorous-soul",
        "clangorous-soulblaze",
        "disarming-voice",
        "echoed-voice",
        "hyper-voice",
        "overdrive",
        "parting-shot",
        "psychic-noise",
        "relic-song",
        "roar",
        "round",
        "screech",
        "sing",
        "snarl",
        "snore",
        "sparkling-aria",
        "supersonic",
        "torment",
        "uproar"
    ]);

    // Condições voláteis, status e efeitos especiais aplicados por golpes
    const MOVE_CONDITION_NAMES = new Set([
        "leech-seed",
        "yawn",
        "perish-song",
        "nightmare",
        "disable",
        "encore",
        "taunt",
        "torment",
        "attract",
        "ingrain",
        "aqua-ring",
        "heal-block",
        "embargo",
        "telekinesis",
        "smack-down",
        "tar-shot",
        "throat-chop",
        "foresight",
        "odor-sleuth",
        "miracle-eye",
        "destiny-bond",
        "wish",
        "rest",
        "refresh",
        "psycho-shift",
        "tri-attack",
        "substitute",
        "stockpile",
        "swallow",
        "transform",
        "mimic",
        "sketch",
        "helping-hand",
        "magic-coat",
        "after-you",
        "quash"
    ]);

    // Golpes que alteram a tipagem elemental de Pokémon
    const TYPE_MOVE_NAMES = new Set([
        "soak", 
        "magic-powder", 
        "forest's-curse", 
        "trick-or-treat", 
        "reflect-type",
        "conversion", 
        "conversion-2", 
        "camouflage", 
        "roost", 
        "burn-up", 
        "double-shock"
    ]);

    // Golpes utilitários de manipulação de estágios de atributos
    const STAT_EFFECT_MOVE_NAMES = new Set([
        "clear-smog", "psych-up", "heart-swap", "power-swap", "guard-swap", "acupressure"
    ]);

    // Golpes de aprisionamento temporário por turnos e dano contínuo (Bind, Wrap, etc.)
    const BINDING_MOVES = new Set([
        "bind", "clamp", "fire-spin", "magma-storm", "sand-tomb", "snap-trap",
        "thunder-cage", "whirlpool", "wrap", "infestation"
    ]);

    // Golpes de aprisionamento permanente que impedem a troca do alvo (Mean Look, Jaw Lock, etc.)
    const PERMANENT_TRAP_MOVES = new Set([
        "mean-look", "block", "spider-web", "anchor-shot", "jaw-lock", "spirit-shackle",
        "thousand-waves", "octolock"
    ]);

    // Mapeamento de Mega Pedras (Mega Stones) para suas respectivas formas Mega Evoluídas
    const MEGA_STONES = {
        venusaurite: "venusaur-mega",
        charizardite_x: "charizard-mega-x",
        charizardite_y: "charizard-mega-y",
        blastoisinite: "blastoise-mega",
        alakazite: "alakazam-mega",
        gengarite: "gengar-mega",
        kangaskhanite: "kangaskhan-mega",
        pinsirite: "pinsir-mega",
        gyaradosite: "gyarados-mega",
        aerodactylite: "aerodactyl-mega",
        mewtwonite_x: "mewtwo-mega-x",
        mewtwonite_y: "mewtwo-mega-y",
        ampharosite: "ampharos-mega",
        scizorite: "scizor-mega",
        heracronite: "heracross-mega",
        houndoominite: "houndoom-mega",
        tyranitarite: "tyranitar-mega",
        blazikenite: "blaziken-mega",
        gardevoirite: "gardevoir-mega",
        mawilite: "mawile-mega",
        aggronite: "aggron-mega",
        medichamite: "medicham-mega",
        manectite: "manectric-mega",
        banettite: "banette-mega",
        absolite: "absol-mega",
        latiasite: "latias-mega",
        latiosite: "latios-mega",
        garchompite: "garchomp-mega",
        lucarionite: "lucario-mega",
        abomasite: "abomasnow-mega",
        beedrillite: "beedrill-mega",
        pidgeotite: "pidgeot-mega",
        slowbronite: "slowbro-mega",
        steelixite: "steelix-mega",
        sceptilite: "sceptile-mega",
        swampertite: "swampert-mega",
        sablenite: "sableye-mega",
        sharpedonite: "sharpedo-mega",
        cameruptite: "camerupt-mega",
        altarianite: "altaria-mega",
        glalitite: "glalie-mega",
        salamencite: "salamence-mega",
        metagrossite: "metagross-mega",
        lopunnite: "lopunny-mega",
        galladite: "gallade-mega",
        audinite: "audino-mega",
        diancite: "diancie-mega"
    };

    // Itens segurados (Held Items) disponíveis no simulador com suas descrições resumidas
    const HELD_ITEMS = {
        leftovers: "Leftovers · recupera HP a cada turno",
        black_sludge: "Black Sludge · recupera HP de Pokémon venenosos",
        life_orb: "Life Orb · aumenta dano e causa recuo",
        expert_belt: "Expert Belt · aumenta dano super efetivo",
        muscle_band: "Muscle Band · aumenta dano físico",
        wise_glasses: "Wise Glasses · aumenta dano especial",
        assault_vest: "Assault Vest · aumenta Defesa Especial",
        eviolite: "Eviolite · aumenta as Defesas",
        focus_sash: "Focus Sash · resiste a um nocaute com HP cheio",
        rocky_helmet: "Rocky Helmet · causa dano em contato",
        shell_bell: "Shell Bell · recupera parte do dano causado",
        sitrus_berry: "Sitrus Berry · recupera HP baixo uma vez",
        oran_berry: "Oran Berry · recupera 10 HP uma vez",
        lum_berry: "Lum Berry · cura uma condição de status uma vez",
        flame_orb: "Flame Orb · causa queimadura no fim do turno",
        toxic_orb: "Toxic Orb · causa envenenamento grave no fim do turno",
        weakness_policy: "Weakness Policy · aumenta Ataque ao sofrer dano super efetivo",
        heavy_duty_boots: "Heavy-Duty Boots · evita armadilhas de entrada",
        charcoal: "Charcoal · aumenta dano de Fogo",
        mystic_water: "Mystic Water · aumenta dano de Água",
        miracle_seed: "Miracle Seed · aumenta dano de Grama",
        magnet: "Magnet · aumenta dano Elétrico",
        never_melt_ice: "Never-Melt Ice · aumenta dano de Gelo",
        black_belt: "Black Belt · aumenta dano Lutador",
        poison_barb: "Poison Barb · aumenta dano Venenoso",
        soft_sand: "Soft Sand · aumenta dano Terrestre",
        sharp_beak: "Sharp Beak · aumenta dano Voador",
        twisted_spoon: "Twisted Spoon · aumenta dano Psíquico",
        silver_powder: "Silver Powder · aumenta dano Inseto",
        hard_stone: "Hard Stone · aumenta dano Pedra",
        spell_tag: "Spell Tag · aumenta dano Fantasma",
        dragon_fang: "Dragon Fang · aumenta dano Dragão",
        black_glasses: "Black Glasses · aumenta dano Noturno",
        metal_coat: "Metal Coat · aumenta dano Aço",
        pixie_plate: "Pixie Plate · aumenta dano Fada"
    };

    return {
        ALL_TYPE_NAMES, SWITCHING_MOVES, PERSONAL_PROTECTION_MOVES, TEAM_PROTECTION_MOVES,
        PROTECTION_MOVES, PROTECTION_BYPASS_MOVES, SOUND_MOVES, MOVE_CONDITION_NAMES,
        TYPE_MOVE_NAMES, STAT_EFFECT_MOVE_NAMES, BINDING_MOVES, PERMANENT_TRAP_MOVES,
        MEGA_STONES, HELD_ITEMS
    };
})();