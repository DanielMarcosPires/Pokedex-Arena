// Mantemencao da batalha: parte 00-state, 01 e 02 (Organizadas e Limpas)

// 1. Inicialização do estado global, referências de elementos do DOM da interface e configuração da trilha sonora
const { api, utils } = window.PokedexApp;
const { escapeHTML, formatName, imageUrl, statTotal, typeLabel } = utils;
const BATTLE_LEVEL = 50;

const {
    ALL_TYPE_NAMES, SWITCHING_MOVES, PERSONAL_PROTECTION_MOVES, TEAM_PROTECTION_MOVES,
    PROTECTION_MOVES, PROTECTION_BYPASS_MOVES, SOUND_MOVES, MOVE_CONDITION_NAMES,
    TYPE_MOVE_NAMES, STAT_EFFECT_MOVE_NAMES, BINDING_MOVES, PERMANENT_TRAP_MOVES,
    MEGA_STONES, HELD_ITEMS
} = window.PokedexApp.battleConfig;

// Seletores de elementos do DOM da aplicação e telas de batalha
const teamBuilder = document.querySelector("#team-builder");
const setupMessage = document.querySelector("#setup-message");
const startButton = document.querySelector("#start-battle");
const setupView = document.querySelector("#battle-setup");
const battleView = document.querySelector("#battle-view");
const battlefield = document.querySelector("#battlefield");
const turnControls = document.querySelector("#turn-controls");
const battleLog = document.querySelector("#battle-log");
const battleTurn = document.querySelector("#battle-turn");
const battleMusicButton = document.querySelector("#battle-music-toggle");
const battleSfxButton = document.querySelector("#battle-sfx-toggle");
const battleAudioStatus = document.querySelector("#battle-audio-status");
const createOnlineRoomButton = document.querySelector("#create-online-room");
const joinOnlineRoomButton = document.querySelector("#join-online-room");
const onlineRoomInput = document.querySelector("#online-room-code");
const copyOnlineRoomButton = document.querySelector("#copy-online-room");
const leaveOnlineRoomButton = document.querySelector("#leave-online-room");
const onlineLobbyStatus = document.querySelector("#online-lobby-status");

// Seletores dos modais de escolha de Pokémon e itens
const pickerDialog = document.querySelector("#pokemon-picker-dialog");
const pickerTitle = document.querySelector("#pokemon-picker-title");
const pickerSearch = document.querySelector("#pokemon-picker-search");
const pickerGeneration = document.querySelector("#pokemon-picker-generation");
const pickerContext = document.querySelector("#pokemon-picker-context");
const pokemonListView = document.querySelector("#pokemon-list-view");
const pokemonDetailView = document.querySelector("#pokemon-detail-view");
const pokemonDetailCard = document.querySelector("#pokemon-detail-card");
const pokemonDetailMessage = document.querySelector("#pokemon-detail-message");
const pendingMoveButtons = document.querySelector("#pending-move-buttons");
const itemPickerView = document.querySelector("#item-picker-view");
const itemPickerGrid = document.querySelector("#item-picker-grid");
const movePickerView = document.querySelector("#move-picker-view");
const movePickerSearch = document.querySelector("#move-picker-search");
const movePickerList = document.querySelector("#move-picker-list");
const movePickerCount = document.querySelector("#move-picker-count");
const movePickerPagination = document.querySelector("#move-picker-pagination");
const movePickerPageLabel = document.querySelector("#move-picker-page");
const movePickerPrev = document.querySelector("#move-picker-prev");
const movePickerNext = document.querySelector("#move-picker-next");

// Instância e estados do sistema de áudio
let audioContext = null;
let battleMusicRequest = 0;
let battleMusicEnabled = false;
let soundEffectsEnabled = true;

const battleMusic = new Audio("./audio/battleMusic.mp3");
battleMusic.loop = true;
battleMusic.preload = "auto";
battleMusic.volume = 0.35;


// 2. Atualiza os rótulos visuais e estados ARIA dos botões de controle de áudio (Música e Efeitos Sonoros) na interface
function updateBattleAudioControls() {
    battleMusicButton.textContent = `Música: ${battleMusicEnabled ? "ligada" : "desligada"}`;
    battleMusicButton.setAttribute("aria-pressed", String(battleMusicEnabled));
    
    battleSfxButton.textContent = `Efeitos sonoros: ${soundEffectsEnabled ? "ligados" : "desligados"}`;
    battleSfxButton.setAttribute("aria-pressed", String(soundEffectsEnabled));
}


// 3. Inicializa, gerencia e retorna o contexto de áudio (Web Audio API), tratando restrições de autoplay e suporte do navegador
function getAudioContext() {
    if (!window.AudioContext) {
        battleAudioStatus.textContent = "Áudio não suportado neste navegador.";
        return null;
    }
    
    if (!audioContext) {
        try {
            audioContext = new window.AudioContext();
        } catch (error) {
            console.error("Não foi possível criar o áudio da batalha:", error);
            battleAudioStatus.textContent = "Não foi possível iniciar o áudio.";
            return null;
        }
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch((error) => {
            console.error("Não foi possível iniciar o áudio da batalha:", error);
            battleAudioStatus.textContent = "Não foi possível iniciar o áudio.";
        });
    }
    
    return audioContext;
}