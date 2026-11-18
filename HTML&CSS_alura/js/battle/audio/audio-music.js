// Mantemencao da batalha: parte 06 a 09 (Organizadas e Limpas)

// 1. Inicializa e reproduz a trilha sonora da batalha, tratando erros de autoplay e estados de áudio
function startBattleMusic() {
    const request = ++battleMusicRequest;
    battleMusicEnabled = true;
    battleAudioStatus.textContent = "Música de batalha ativada.";
    updateBattleAudioControls();

    battleMusic.play().catch((error) => {
        if (request !== battleMusicRequest) return;
        console.error("Não foi possível reproduzir a música da batalha:", error);
        battleMusicEnabled = false;
        battleAudioStatus.textContent = "Não foi possível reproduzir a música da batalha.";
        updateBattleAudioControls();
    });
}

// Declaração de variáveis globais de estado da aplicação, times, seletores de Pokémon/Golpes e conexões de rede
const movePickerMessage = document.querySelector("#move-picker-message");
const movePickerConfirm = document.querySelector("#confirm-move-selection");
const pickerCount = document.querySelector("#pokemon-picker-count");
const pickerGrid = document.querySelector("#pokemon-picker-grid");
const pickerPagination = document.querySelector("#pokemon-picker-pagination");
const pickerPageLabel = document.querySelector("#pokemon-picker-page");
const pickerPrev = document.querySelector("#pokemon-picker-prev");
const pickerNext = document.querySelector("#pokemon-picker-next");
const pickerRetry = document.querySelector("#pokemon-picker-retry");
const switchDialog = document.querySelector("#switch-picker-dialog");
const switchPickerList = document.querySelector("#switch-picker-list");

const pokemonTeams = [Array(6).fill(null), Array(6).fill(null)];
const teamRandomizing = [false, false];
const playerNames = ["Jogador 1", "Jogador 2"];
let pokemonList = [];

const speciesMoveCache = new Map();
const evolutionEligibilityCache = new Map();
const typeDetailCache = new Map();

let teamModes = ["manual", "manual"];
let pickerTarget = null;
let pickerMode = "list";
let pendingPokemon = null;
let pendingHeldItem = null;
let pendingMoves = [];
let pendingMoveDetails = {};
let pickerPage = 1;
let movePickerPage = 1;
let pickerRequestVersion = 0;
let movePickerRequestVersion = 0;
let pickerSearchTimer = null;
let movePickerSearchTimer = null;
let renderedLogLength = 0;
let switchTarget = null;
let game = null;

// Variáveis de controle multiplayer (Socket.IO / Online)
let onlineSocket = null;
let socketIoClientPromise = null;
let onlineMode = false;
let onlineRoomCode = "";
let onlineRole = null;
let onlineTeamSubmitted = false;
let onlineTeamsLoading = false;
let onlineBattleStarted = false;
let onlineBattleReady = false;
let onlineWaitingForState = false;
let onlineForcedSwitchPending = false;
let pendingForcedSwitchResolution = null;


// 2. Define mensagens informativas ou de erro no painel de configuração inicial
function setSetupMessage(message, isError) {
    setupMessage.textContent = message;
    setupMessage.classList.toggle("error", Boolean(isError));
}


// 3. Define o status visual do lobby online, indicando sucesso ou erros de conexão
function setOnlineLobbyStatus(message, isError = false) {
    onlineLobbyStatus.textContent = message;
    onlineLobbyStatus.classList.toggle("error", isError);
}


// 4. Atualiza dinamicamente a interface e os botões do lobby online com base no estado da sala e submissão de times
function updateOnlineLobby() {
    const joined = onlineMode && onlineRoomCode && Number.isInteger(onlineRole);
    
    createOnlineRoomButton.hidden = joined;
    onlineRoomInput.readOnly = joined;
    joinOnlineRoomButton.hidden = joined;
    copyOnlineRoomButton.hidden = !joined;
    leaveOnlineRoomButton.hidden = !joined;

    if (joined) {
        onlineRoomInput.value = onlineRoomCode;
    }

    startButton.textContent = onlineMode
        ? onlineTeamSubmitted ? "Aguardando adversário..." : "Enviar meu time"
        : "Iniciar batalha";
}