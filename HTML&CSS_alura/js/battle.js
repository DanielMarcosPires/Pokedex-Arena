window.PokedexApp.battle = (() => {
    const { api, utils } = window.PokedexApp;
    const { escapeHTML, formatName, imageUrl, statTotal, typeLabel } = utils;
    const BATTLE_LEVEL = 50;
    const ALL_TYPE_NAMES = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
        "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
        "steel", "fairy"
    ];
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
    const PERSONAL_PROTECTION_MOVES = new Set(["protect", "detect", "max-guard"]);
    const TEAM_PROTECTION_MOVES = new Set(["wide-guard", "quick-guard", "mat-block"]);
    const PROTECTION_MOVES = new Set([
        ...PERSONAL_PROTECTION_MOVES,
        ...TEAM_PROTECTION_MOVES,
        "endure"
    ]);
    const PROTECTION_BYPASS_MOVES = new Set([
        "feint",
        "hyperspace-fury",
        "hyperspace-hole",
        "phantom-force",
        "shadow-force",
        "g-max-one-blow"
    ]);
    const SOUND_MOVES = new Set([
        "boomburst", "bug-buzz", "chatter", "clangorous-soul", "clangorous-soulblaze",
        "disarming-voice", "echoed-voice", "hyper-voice", "overdrive", "parting-shot",
        "psychic-noise", "relic-song", "roar", "round", "screech", "sing",
        "snarl", "snore", "sparkling-aria", "supersonic", "torment", "uproar"
    ]);
    const MOVE_CONDITION_NAMES = new Set([
        "leech-seed", "yawn", "perish-song", "nightmare", "disable", "encore", "taunt",
        "torment", "attract", "ingrain", "aqua-ring", "heal-block", "embargo", "telekinesis",
        "smack-down", "tar-shot", "throat-chop", "foresight", "odor-sleuth", "miracle-eye",
        "destiny-bond", "wish", "rest", "refresh", "psycho-shift", "tri-attack", "substitute",
        "stockpile", "swallow", "transform", "mimic", "sketch", "helping-hand", "magic-coat",
        "after-you", "quash"
    ]);
    const TYPE_MOVE_NAMES = new Set([
        "soak", "magic-powder", "forest's-curse", "trick-or-treat", "reflect-type",
        "conversion", "conversion-2", "camouflage", "roost", "burn-up", "double-shock"
    ]);
    const STAT_EFFECT_MOVE_NAMES = new Set([
        "clear-smog", "psych-up", "heart-swap", "power-swap", "guard-swap", "acupressure"
    ]);
    const BINDING_MOVES = new Set([
        "bind", "clamp", "fire-spin", "magma-storm", "sand-tomb", "snap-trap",
        "thunder-cage", "whirlpool", "wrap", "infestation"
    ]);
    const PERMANENT_TRAP_MOVES = new Set([
        "mean-look", "block", "spider-web", "anchor-shot", "jaw-lock", "spirit-shackle",
        "thousand-waves", "octolock"
    ]);
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
    let audioContext = null;
    let battleMusicRequest = 0;
    let battleMusicEnabled = false;
    let soundEffectsEnabled = true;
    const battleMusic = new Audio("./audio/battleMusic.mp3");
    battleMusic.loop = true;
    battleMusic.preload = "auto";
    battleMusic.volume = 0.35;

    function updateBattleAudioControls() {
        battleMusicButton.textContent = `Música: ${battleMusicEnabled ? "ligada" : "desligada"}`;
        battleMusicButton.setAttribute("aria-pressed", String(battleMusicEnabled));
        battleSfxButton.textContent = `Efeitos sonoros: ${soundEffectsEnabled ? "ligados" : "desligados"}`;
        battleSfxButton.setAttribute("aria-pressed", String(soundEffectsEnabled));
    }

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

    function playTone(context, frequency, startAt, duration, waveform, volume) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration);
    }

    function playSoundEffect(effect) {
        if (!soundEffectsEnabled) return;
        const context = getAudioContext();
        if (!context || context.state !== "running") return;
        const patterns = {
            attack: [[220, 0, 0.1, "square"], [440, 0.07, 0.12, "triangle"]],
            hit: [[164.81, 0, 0.14, "triangle"], [110, 0.06, 0.12, "sine"]],
            item: [[659.25, 0, 0.1, "triangle"], [880, 0.08, 0.16, "sine"]],
            heal: [[523.25, 0, 0.14, "sine"], [659.25, 0.11, 0.14, "sine"], [783.99, 0.22, 0.2, "sine"]]
        };
        (patterns[effect] || patterns.item).forEach(([frequency, offset, duration, waveform]) => {
            playTone(context, frequency, context.currentTime + offset, duration, waveform, 0.045);
        });
    }

    function stopBattleMusic() {
        battleMusicRequest++;
        battleMusic.pause();
        battleMusic.currentTime = 0;
        battleMusicEnabled = false;
        updateBattleAudioControls();
    }

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

    function setSetupMessage(message, isError) {
        setupMessage.textContent = message;
        setupMessage.classList.toggle("error", Boolean(isError));
    }

    function setOnlineLobbyStatus(message, isError = false) {
        onlineLobbyStatus.textContent = message;
        onlineLobbyStatus.classList.toggle("error", isError);
    }

    function updateOnlineLobby() {
        const joined = onlineMode && onlineRoomCode && Number.isInteger(onlineRole);
        createOnlineRoomButton.hidden = joined;
        onlineRoomInput.readOnly = joined;
        joinOnlineRoomButton.hidden = joined;
        copyOnlineRoomButton.hidden = !joined;
        leaveOnlineRoomButton.hidden = !joined;
        if (joined) onlineRoomInput.value = onlineRoomCode;
        startButton.textContent = onlineMode
            ? onlineTeamSubmitted ? "Aguardando adversário..." : "Enviar meu time"
            : "Iniciar batalha";
    }

    function loadSocketIoClient() {
        if (typeof window.io === "function") return Promise.resolve();
        if (socketIoClientPromise) return socketIoClientPromise;
        if (!["http:", "https:"].includes(window.location.protocol)) {
            return Promise.reject(new Error("Abra a página pelo servidor Node.js para jogar online."));
        }
        socketIoClientPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/socket.io/socket.io.js";
            script.async = true;
            script.onload = () => {
                if (typeof window.io === "function") resolve();
                else reject(new Error("O cliente Socket.IO não foi carregado pelo servidor."));
            };
            script.onerror = () => reject(new Error("Não foi possível carregar o cliente Socket.IO."));
            document.head.append(script);
        });
        return socketIoClientPromise.catch((error) => {
            socketIoClientPromise = null;
            throw error;
        });
    }

    function bindOnlineSocket(socket) {
        socket.on("connect_error", (error) => {
            console.error("Erro de conexão com a sala online:", error);
            setOnlineLobbyStatus("Não foi possível conectar ao servidor online.", true);
        });
        socket.on("room:player-joined", () => {
            setOnlineLobbyStatus("Amigo conectado. Monte seu time e envie para a sala.");
        });
        socket.on("room:player-left", () => {
            setOnlineLobbyStatus("Seu adversário saiu da sala.", true);
            if (onlineBattleStarted) {
                onlineWaitingForState = true;
                renderActionPanel();
            }
        });
        socket.on("room:closed", ({ message }) => {
            setOnlineLobbyStatus(message || "A sala foi encerrada.", true);
            if (pendingForcedSwitchResolution) {
                const resolve = pendingForcedSwitchResolution;
                pendingForcedSwitchResolution = null;
                resolve(false);
            }
            resetOnlineSession();
        });
        socket.on("room:teams-ready", (payload) => {
            loadOnlineTeams(payload).catch((error) => {
                console.error("Erro ao preparar os times online:", error);
                setOnlineLobbyStatus("Não foi possível carregar os times da sala.", true);
                onlineTeamsLoading = false;
            });
        });
        socket.on("battle:ready", () => {
            onlineBattleReady = true;
            onlineWaitingForState = false;
            onlineLobbyStatus.textContent = "";
            renderBattle();
        });
        socket.on("battle:team-actions", (payload) => {
            handleOnlineTeamActions(payload).catch((error) => {
                console.error("Ação online inválida:", error);
                setOnlineLobbyStatus("Não foi possível sincronizar a ação do adversário.", true);
            });
        });
        socket.on("battle:state", (payload) => {
            if (onlineRole !== 1 || !onlineBattleStarted) return;
            try {
                onlineWaitingForState = false;
                onlineForcedSwitchPending = false;
                applyOnlineGameState(payload.state);
            } catch (error) {
                console.error("Estado online inválido:", error);
                setOnlineLobbyStatus("Não foi possível sincronizar o estado da batalha.", true);
            }
        });
        socket.on("battle:visual-state", (payload) => {
            if (onlineRole !== 1 || !onlineBattleStarted || !onlineBattleReady) return;
            try {
                applyOnlineGameState(payload.state, true);
            } catch (error) {
                console.error("Efeito online inválido:", error);
                setOnlineLobbyStatus("Não foi possível sincronizar o efeito da batalha.", true);
            }
        });
        socket.on("battle:forced-switch", (payload) => {
            if (onlineRole !== 0 || !onlineBattleStarted) return;
            try {
                applyRemoteForcedSwitch(payload);
            } catch (error) {
                console.error("Troca online inválida:", error);
                setOnlineLobbyStatus("Não foi possível sincronizar a troca do adversário.", true);
            }
        });
        socket.on("battle:forced-switch-request", (payload) => {
            if (onlineRole !== 1 || !onlineBattleStarted
                || !Number.isInteger(payload?.activeSlot) || payload.activeSlot < 0
                || payload.activeSlot >= game.format) return;
            openSwitchPicker(1, payload.activeSlot, true, payload.moveName || "");
        });
    }

    async function ensureOnlineSocket() {
        await loadSocketIoClient();
        if (!onlineSocket) {
            onlineSocket = window.io({ autoConnect: false });
            bindOnlineSocket(onlineSocket);
        }
        if (onlineSocket.connected) return onlineSocket;
        await new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error("Tempo esgotado ao conectar ao servidor."));
            }, 10000);
            const onConnect = () => {
                cleanup();
                resolve();
            };
            const onError = (error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                window.clearTimeout(timeout);
                onlineSocket.off("connect", onConnect);
                onlineSocket.off("connect_error", onError);
            };
            onlineSocket.once("connect", onConnect);
            onlineSocket.once("connect_error", onError);
            onlineSocket.connect();
        });
        return onlineSocket;
    }

    async function emitOnlineRequest(eventName, payload) {
        const socket = await ensureOnlineSocket();
        return new Promise((resolve, reject) => {
            socket.timeout(10000).emit(eventName, payload, (timeoutError, response) => {
                if (timeoutError) {
                    reject(new Error("O servidor não respondeu a tempo."));
                    return;
                }
                if (response?.ok) resolve(response);
                else reject(new Error(response?.error || "O servidor recusou a solicitação."));
            });
        });
    }

    function resetOnlineSession() {
        onlineMode = false;
        onlineRoomCode = "";
        onlineRole = null;
        onlineTeamSubmitted = false;
        onlineTeamsLoading = false;
        onlineBattleStarted = false;
        onlineBattleReady = false;
        onlineWaitingForState = false;
        onlineForcedSwitchPending = false;
        updateOnlineLobby();
        if (game) renderActionPanel();
        if (pokemonList.length) renderTeamBuilder();
    }

    async function createOnlineRoom() {
        createOnlineRoomButton.disabled = true;
        if (soundEffectsEnabled) getAudioContext();
        try {
            const response = await emitOnlineRequest("room:create", {});
            onlineMode = true;
            onlineRoomCode = response.roomCode;
            onlineRole = 0;
            onlineTeamSubmitted = false;
            updateOnlineLobby();
            setOnlineLobbyStatus("Sala criada. Compartilhe o código e monte seu time.");
            renderTeamBuilder();
        } catch (error) {
            setOnlineLobbyStatus(error.message, true);
        } finally {
            createOnlineRoomButton.disabled = false;
        }
    }

    async function joinOnlineRoom() {
        if (onlineMode) {
            setOnlineLobbyStatus("Saia da sala atual antes de entrar em outra.", true);
            return;
        }
        const roomCode = onlineRoomInput.value.trim().toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
            setOnlineLobbyStatus("Digite um código de sala válido com seis caracteres.", true);
            return;
        }
        joinOnlineRoomButton.disabled = true;
        if (soundEffectsEnabled) getAudioContext();
        try {
            const response = await emitOnlineRequest("room:join", { roomCode });
            onlineMode = true;
            onlineRoomCode = response.roomCode;
            onlineRole = 1;
            onlineTeamSubmitted = false;
            updateOnlineLobby();
            setOnlineLobbyStatus("Conectado à sala. Monte seu time e envie para começar.");
            renderTeamBuilder();
        } catch (error) {
            setOnlineLobbyStatus(error.message, true);
        } finally {
            joinOnlineRoomButton.disabled = false;
        }
    }

    async function leaveOnlineRoom() {
        if (!onlineMode) return;
        try {
            await emitOnlineRequest("room:leave", { roomCode: onlineRoomCode });
        } catch (error) {
            console.error("Erro ao sair da sala online:", error);
        }
        resetOnlineSession();
        setOnlineLobbyStatus("Você saiu da sala.");
    }

    async function copyOnlineInvite() {
        try {
            await navigator.clipboard.writeText(onlineRoomCode);
            setOnlineLobbyStatus("Código da sala copiado.");
        } catch (error) {
            console.error("Não foi possível copiar o código da sala:", error);
            onlineRoomInput.focus();
            onlineRoomInput.select();
            setOnlineLobbyStatus("Selecione e copie o código da sala manualmente.", true);
        }
    }

    function serializeOnlineTeam(teamIndex) {
        const team = pokemonTeams[teamIndex];
        const moveNames = team.map((slot) => chooseMoves(slot, teamModes[teamIndex])
            .map(({ move }) => move.name));
        team.forEach((slot, index) => {
            slot.selectedMoves = moveNames[index];
        });
        teamModes[teamIndex] = "manual";
        return {
            name: playerNames[teamIndex].trim() || `Jogador ${teamIndex + 1}`,
            slots: team.map((slot, index) => ({
                pokemonId: slot.entry.id,
                heldItem: slot.heldItem || null,
                moveNames: moveNames[index]
            }))
        };
    }

    async function submitOnlineTeam() {
        if (!onlineMode || !Number.isInteger(onlineRole) || onlineTeamSubmitted) return;
        if (!validateTeams([onlineRole])) return;
        const team = serializeOnlineTeam(onlineRole);
        startButton.disabled = true;
        onlineTeamSubmitted = true;
        renderTeamBuilder();
        setOnlineLobbyStatus("Enviando seu time para a sala...");
        try {
            await emitOnlineRequest("room:submit-team", { roomCode: onlineRoomCode, team });
            updateOnlineLobby();
            renderTeamBuilder();
            setOnlineLobbyStatus("Time enviado. Aguardando o adversário.");
        } catch (error) {
            onlineTeamSubmitted = false;
            startButton.disabled = false;
            renderTeamBuilder();
            setOnlineLobbyStatus(error.message, true);
        }
    }

    async function loadOnlineTeams(payload) {
        if (!onlineMode || onlineTeamsLoading || onlineBattleStarted) return;
        if (!Array.isArray(payload?.teams) || payload.teams.length !== 2) {
            throw new Error("O servidor enviou uma configuração de times inválida.");
        }
        onlineTeamsLoading = true;
        onlineTeamSubmitted = true;
        startButton.disabled = true;
        setOnlineLobbyStatus("Carregando os times da sala...");
        try {
            for (let teamIndex = 0; teamIndex < 2; teamIndex++) {
                const config = payload.teams[teamIndex];
                if (!config || !Array.isArray(config.slots) || config.slots.length !== 6) {
                    throw new Error(`O Time ${teamIndex + 1} recebido está incompleto.`);
                }
                const existing = pokemonTeams[teamIndex];
                const matchesLocalTeam = teamIndex === onlineRole
                    && existing.every((slot, index) => slot?.entry.id === config.slots[index].pokemonId);
                const localPokemon = matchesLocalTeam
                    ? existing
                    : await mapWithConcurrency(config.slots, 6, async (slot) => {
                        const entry = pokemonList.find(({ id }) => id === slot.pokemonId);
                        if (!entry || !isSelectablePokemon(entry)) {
                            throw new Error(`Pokémon indisponível: ${slot.pokemonId}`);
                        }
                        return {
                            entry,
                            pokemon: await ensurePokemonMoves(await api.getPokemon(entry.id)),
                            heldItem: slot.heldItem,
                            selectedMoves: slot.moveNames,
                            loading: false
                        };
                    });
                pokemonTeams[teamIndex] = localPokemon.map((slot, index) => ({
                    ...slot,
                    heldItem: config.slots[index].heldItem,
                    selectedMoves: [...config.slots[index].moveNames],
                    loading: false
                }));
                playerNames[teamIndex] = config.name;
                teamModes[teamIndex] = "manual";
            }
            renderTeamBuilder();
            await startBattle();
            if (!onlineBattleStarted) throw new Error("A batalha não foi iniciada.");
            await emitOnlineRequest("battle:ready", { roomCode: onlineRoomCode });
        } finally {
            onlineTeamsLoading = false;
            updateOnlineLobby();
        }
    }

    function isSelectablePokemon(pokemon) {
        return !/(?:-mega(?:-|$)|-(?:gmax|gigantamax|dynamax|eternamax)(?:-|$))/i.test(pokemon.name);
    }

    function itemSpriteUrl(itemName) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName.replace(/_/g, "-")}.png`;
    }

    function itemsForPokemon(pokemonName) {
        return [
            { name: "", title: "Sem item", description: "Este Pokémon não segurará nenhum item." },
            ...Object.entries(HELD_ITEMS).map(([name, description]) => ({
                name,
                title: formatName(name.replace(/_/g, "-")),
                description: description.split(" · ").slice(1).join(" · ")
            })),
            ...Object.entries(MEGA_STONES).filter(([, formName]) =>
                formName.startsWith(`${pokemonName}-mega`)
                    && pokemonList.some(({ name }) => name === formName))
                    .map(([name]) => ({
                        name,
                        title: formatName(name.replace(/_/g, "-")),
                        description: "Permite Mega Evoluir este Pokémon uma vez durante a batalha."
                    }))
        ];
    }

    async function isEvioliteEligible(pokemon) {
        const speciesUrl = pokemon.species?.url;
        if (!speciesUrl) throw new Error(`Espécie indisponível para verificar Eviolite em ${pokemon.name}`);
        if (!evolutionEligibilityCache.has(speciesUrl)) {
            evolutionEligibilityCache.set(speciesUrl, (async () => {
                const species = await api.fetchJson(speciesUrl);
                const evolutionChain = await api.fetchJson(species.evolution_chain.url);
                const findSpecies = (node) => {
                    if (node.species.name === species.name) return node.evolves_to.length > 0;
                    for (const evolution of node.evolves_to) {
                        const eligible = findSpecies(evolution);
                        if (eligible !== null) return eligible;
                    }
                    return null;
                };
                const eligible = findSpecies(evolutionChain.chain);
                if (typeof eligible !== "boolean") {
                    throw new Error(`Espécie não encontrada na cadeia evolutiva de ${pokemon.name}`);
                }
                return eligible;
            })());
        }
        try {
            return await evolutionEligibilityCache.get(speciesUrl);
        } catch (error) {
            evolutionEligibilityCache.delete(speciesUrl);
            throw error;
        }
    }

    function plainName(name) {
        return String(name).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    function getMemberTypeNames(member) {
        return member.currentTypes || member.pokemon.types.map(({ type }) => type.name);
    }

    function setMemberTypeNames(member, types) {
        member.currentTypes = [...new Set(types)];
    }

    function memberResetTypes(member) {
        return member.megaEvolved ? member.megaTypes : member.originalTypes;
    }

    function canMegaEvolve(member, teamIndex, activeSlot) {
        const actionAlreadyQueued = game.pendingActions[teamIndex]
            .some((action) => action.megaEvolve);
        return Boolean(member.megaPokemon && member.heldItem && !game.megaUsed[teamIndex]
            && !actionAlreadyQueued);
    }

    function waitForAnimation(duration) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    function uniqueMoves(moves) {
        return [...new Map(moves.map((entry) => [entry.move.name, entry])).values()]
            .sort((a, b) => a.move.name.localeCompare(b.move.name));
    }

    async function ensurePokemonMoves(pokemon) {
        if (uniqueMoves(pokemon.moves || []).length >= 4) return pokemon;
        const speciesUrl = pokemon.species?.url;
        if (!speciesUrl) throw new Error(`Não há movimentos disponíveis para ${pokemon.name}`);

        if (!speciesMoveCache.has(speciesUrl)) {
            speciesMoveCache.set(speciesUrl, (async () => {
                const species = await api.fetchJson(speciesUrl);
                const defaultVariety = species.varieties.find(({ is_default }) => is_default);
                if (!defaultVariety) throw new Error(`Forma padrão indisponível para ${pokemon.name}`);
                const defaultId = utils.pokemonIdFromUrl(defaultVariety.pokemon.url);
                const defaultPokemon = await api.getPokemon(defaultId);
                if (uniqueMoves(defaultPokemon.moves || []).length < 4) {
                    throw new Error(`A espécie de ${pokemon.name} não possui quatro golpes disponíveis`);
                }
                return defaultPokemon.moves;
            })());
        }

        try {
            return { ...pokemon, moves: await speciesMoveCache.get(speciesUrl) };
        } catch (error) {
            speciesMoveCache.delete(speciesUrl);
            throw error;
        }
    }

    function latestLearnLevel(moveEntry) {
        let level = 0;
        moveEntry.version_group_details.forEach(({ level_learned_at, move_learn_method }) => {
            if (move_learn_method.name === "level-up" && level_learned_at > 0) level = level_learned_at;
        });
        return level;
    }

    function automaticMoves(moves) {
        const available = uniqueMoves(moves);
        const levelMoves = available
            .map((entry) => ({ entry, level: latestLearnLevel(entry) }))
            .filter(({ level }) => level > 0)
            .sort((a, b) => b.level - a.level || a.entry.move.name.localeCompare(b.entry.move.name))
            .map(({ entry }) => entry);
        const chosen = levelMoves.slice(0, 4);
        available.forEach((entry) => {
            if (chosen.length < 4 && !chosen.some(({ move }) => move.name === entry.move.name)) chosen.push(entry);
        });
        return chosen;
    }

    function randomMoves(moves) {
        const available = uniqueMoves(moves);
        for (let index = available.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
        }
        return available.slice(0, 4);
    }

    function renderMovePreview(move) {
        const localizedDescription = move.flavor_text_entries?.find(({ language }) =>
            ["pt", "pt-br"].includes(language.name.toLowerCase()))?.flavor_text;
        const englishEffect = move.effect_entries?.find(({ language }) => language.name === "en")
            || move.effect_entries?.[0];
        const description = (localizedDescription || englishEffect?.short_effect || englishEffect?.effect
            || "Descrição indisponível.")
            .replace(/\$effect_chance/g, String(move.effect_chance ?? ""))
            .replace(/\s+/g, " ")
            .trim();
        const type = move.type?.name || "normal";
        const power = move.power ? `${move.power} de poder` : "Golpe de status";
        const accuracy = move.accuracy === null ? "Precisão infalível" : `${move.accuracy}% de precisão`;
        return `<div class="move-preview-heading">
            <strong>${formatName(move.name)}</strong>
            <span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>
        </div>
        <p>${escapeHTML(description)}</p>
        <span class="move-preview-meta">${power} · ${accuracy}</span>`;
    }

    function renderSlot(slot, teamIndex, slotIndex) {
        const selection = slot?.entry;
        const heldItem = slot?.heldItem || "";
        if (selection && slot.pokemon) {
            const types = slot.pokemon.types.map(({ type }) =>
                `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`).join("");
            const heldItemSlot = heldItem
                ? `<span class="team-slot-held-item">
                    <img src="${escapeHTML(itemSpriteUrl(heldItem))}"
                        alt="${escapeHTML(formatName(heldItem.replace(/_/g, "-")))}"
                        onerror="this.hidden = true">
                </span>`
                : '<span class="team-slot-held-item" aria-label="Sem item segurado"><span aria-hidden="true">+</span></span>';
            return `<button class="team-slot" type="button"
                aria-label="Editar ${formatName(selection.name)}"
                data-team="${teamIndex}" data-slot="${slotIndex}" ${teamRandomizing[teamIndex] || onlineTeamSubmitted ? "disabled" : ""}>
                <span class="team-slot-content">
                    <span class="slot-pokemon-art">
                        <img src="${escapeHTML(imageUrl(slot.pokemon))}" alt="">
                    </span>
                    <span class="team-slot-info">
                        ${heldItemSlot}
                        <span class="team-slot-title">${formatName(selection.name)}</span>
                        <span class="slot-types">${types}</span>
                    </span>
                </span>
            </button>`;
        }

        let preview = '<div class="slot-preview-placeholder">Nenhum Pokémon selecionado</div>';
        if (selection && slot.loading) {
            preview = '<div class="slot-loading">Carregando dados do Pokémon...</div>';
        } else if (selection) {
            preview = '<div class="slot-loading">Falha ao carregar. Selecione novamente para tentar outra vez.</div>';
        }

        return `<button class="team-slot is-empty" type="button"
            aria-label="${selection ? `Editar ${formatName(selection.name)}` : `Escolher Pokémon ${slotIndex + 1} para o Time ${teamIndex + 1}`}"
            data-team="${teamIndex}" data-slot="${slotIndex}" ${teamRandomizing[teamIndex] || onlineTeamSubmitted ? "disabled" : ""}>
            <div class="team-slot-heading">
                <span class="team-slot-title">${selection && slot.pokemon ? formatName(selection.name) : `Pokémon ${slotIndex + 1}`}</span>
                <span class="team-slot-status">${selection ? slot.loading ? "Carregando" : "Falha ao carregar" : "Vaga livre"}</span>
            </div>
            ${preview}
        </button>`;
    }

    function renderTeamBuilder() {
        teamBuilder.innerHTML = [0, 1].map((teamIndex) => `
            <section class="team-panel ${onlineMode && teamIndex !== onlineRole ? "online-opponent-hidden" : ""}">
                <div class="team-panel-heading">
                    <h3>${onlineMode ? "Seu time" : `Time ${teamIndex + 1}`}</h3>
                    <div class="team-panel-controls">
                        <label class="team-name-control">Nome do jogador
                            <input type="text" maxlength="24" value="${escapeHTML(playerNames[teamIndex])}" data-player-name="${teamIndex}"
                                ${onlineTeamSubmitted ? "disabled" : ""}>
                        </label>
                        <label class="move-mode-control">Configuração dos golpes
                            <select data-move-mode="${teamIndex}" ${teamRandomizing[teamIndex] || onlineTeamSubmitted ? "disabled" : ""}>
                                <option value="manual" ${teamModes[teamIndex] === "manual" ? "selected" : ""}>Manual · escolher 4</option>
                                <option value="automatic" ${teamModes[teamIndex] === "automatic" ? "selected" : ""}>Automática · níveis mais altos</option>
                                <option value="random" ${teamModes[teamIndex] === "random" ? "selected" : ""}>Aleatória · sortear 4</option>
                            </select>
                        </label>
                    </div>
                    <button class="team-random-button" type="button" data-random-team="${teamIndex}"
                        ${teamRandomizing[teamIndex] || onlineTeamSubmitted || pokemonTeams[teamIndex].some((slot) => slot?.loading) ? "disabled" : ""}>
                        ${teamRandomizing[teamIndex] ? "Sorteando..." : pokemonTeams[teamIndex].some((slot) => slot?.loading) ? "Aguarde carregamento" : "Sortear 6 Pokémon"}
                    </button>
                </div>
                <div class="team-slots">
                    ${pokemonTeams[teamIndex].map((slot, slotIndex) => renderSlot(slot, teamIndex, slotIndex)).join("")}
                </div>
            </section>`).join("");

        teamBuilder.querySelectorAll(".team-slot").forEach((slot) => {
            slot.addEventListener("click", () => openPokemonSlot(
                Number(slot.dataset.team), Number(slot.dataset.slot)
            ));
        });

        teamBuilder.querySelectorAll("[data-random-team]").forEach((button) => {
            button.addEventListener("click", () => randomizeTeam(Number(button.dataset.randomTeam)));
        });

        teamBuilder.querySelectorAll("[data-player-name]").forEach((input) => {
            input.addEventListener("input", () => {
                playerNames[Number(input.dataset.playerName)] = input.value;
            });
        });

        teamBuilder.querySelectorAll("[data-move-mode]").forEach((select) => {
            select.addEventListener("change", () => {
                teamModes[Number(select.dataset.moveMode)] = select.value;
                renderTeamBuilder();
            });
        });
        teamBuilder.querySelectorAll(".online-opponent-hidden").forEach((panel) => {
            panel.setAttribute("aria-hidden", "true");
        });
        startButton.disabled = teamRandomizing.some(Boolean) || onlineTeamSubmitted;
        updateOnlineLobby();
    }

    async function randomizeTeam(teamIndex) {
        const selectablePokemon = pokemonList.filter(isSelectablePokemon);
        if (teamRandomizing[teamIndex] || pokemonTeams[teamIndex].some((slot) => slot?.loading) || selectablePokemon.length < 6) {
            setSetupMessage("Aguarde o carregamento dos Pokémon antes de sortear o time.", true);
            return;
        }

        const previousTeam = pokemonTeams[teamIndex];
        const shuffled = [...selectablePokemon];
        for (let index = shuffled.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }
        const entries = shuffled.slice(0, 6);
        teamRandomizing[teamIndex] = true;
        pokemonTeams[teamIndex] = entries.map((entry) => ({
            entry,
            pokemon: null,
            heldItem: null,
            selectedMoves: [],
            loading: true
        }));
        setSetupMessage(`Sorteando seis Pokémon para o Time ${teamIndex + 1}...`, false);
        renderTeamBuilder();

        try {
            const pokemonDetails = await mapWithConcurrency(entries, 6, async ({ id }) =>
                ensurePokemonMoves(await api.getPokemon(id)));
            pokemonTeams[teamIndex].forEach((slot, index) => {
                slot.pokemon = pokemonDetails[index];
                slot.loading = false;
            });
            setSetupMessage(`Time ${teamIndex + 1} sorteado com seis Pokémon diferentes.`, false);
        } catch (error) {
            console.error(`Erro ao sortear Pokémon para o Time ${teamIndex + 1}:`, error);
            pokemonTeams[teamIndex] = previousTeam;
            setSetupMessage(`Não foi possível sortear o Time ${teamIndex + 1}. Tente novamente.`, true);
        } finally {
            teamRandomizing[teamIndex] = false;
            renderTeamBuilder();
        }
    }

    async function selectPokemon(teamIndex, slotIndex, selection) {
        const { entry, heldItem, selectedMoves, moveDetails, pokemon } = selection;
        const currentSlot = pokemonTeams[teamIndex][slotIndex];
        if (currentSlot?.entry.id === entry.id && currentSlot.pokemon) {
            currentSlot.heldItem = heldItem;
            currentSlot.selectedMoves = [...selectedMoves];
            currentSlot.moveDetails = { ...moveDetails };
            renderTeamBuilder();
            return;
        }

        const slot = {
            entry,
            pokemon: null,
            heldItem,
            selectedMoves: [...selectedMoves],
            moveDetails: { ...moveDetails },
            loading: true
        };
        pokemonTeams[teamIndex][slotIndex] = slot;
        renderTeamBuilder();
        setSetupMessage("", false);
        try {
            slot.pokemon = await ensurePokemonMoves(pokemon || await api.getPokemon(entry.id));
            if (pokemonTeams[teamIndex][slotIndex] !== slot) return;
            slot.loading = false;
            renderTeamBuilder();
        } catch (error) {
            console.error(`Erro ao carregar ${entry.name} para a batalha:`, error);
            if (pokemonTeams[teamIndex][slotIndex] === slot) {
                slot.loading = false;
                renderTeamBuilder();
                setSetupMessage(`Não foi possível carregar ${formatName(entry.name)}. Tente selecionar novamente.`, true);
            }
        }
    }

    function renderPickerCard(entry, pokemon) {
        const target = pickerTarget;
        const selected = pokemonTeams[target.teamIndex][target.slotIndex]?.entry.id === entry.id;
        const alreadyInTeam = pokemonTeams[target.teamIndex].some((slot, index) =>
            index !== target.slotIndex && slot?.entry.id === entry.id);
        const button = document.createElement("button");
        const types = pokemon.types.map(({ type }) =>
            `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`).join("");
        const status = selected ? "Neste espaço" : alreadyInTeam ? "Já está no time" : "Selecionar";
        button.type = "button";
        button.className = `pokemon-card picker-pokemon-card${selected ? " is-current" : ""}`;
        button.disabled = alreadyInTeam;
        button.setAttribute("aria-label", `${alreadyInTeam ? "Já está no time: " : "Selecionar "}${formatName(entry.name)}`);
        button.setAttribute("aria-pressed", String(selected));
        button.innerHTML = `
            <div class="card-art">
                <span class="pokemon-number">#${String(entry.id).padStart(4, "0")}</span>
                <span class="picker-card-status">${status}</span>
                <img src="${escapeHTML(imageUrl(pokemon))}" alt="" loading="lazy"
                    onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png'">
            </div>
            <div class="card-info">
                <div class="card-name-row">
                    <span class="card-name">${formatName(entry.name)}</span>
                    <span class="card-bst">BST ${statTotal(pokemon)}</span>
                </div>
                <div class="type-list">${types}</div>
            </div>`;
        button.addEventListener("click", () => choosePokemon(entry, pokemon));
        return button;
    }

    async function renderPokemonPicker() {
        if (pickerMode !== "list") return;
        const requestVersion = ++pickerRequestVersion;
        const query = pickerSearch.value.trim().toLowerCase();
        const idQuery = Number(query.replace(/^#/, ""));
        const selectedGeneration = Number(pickerGeneration.value);
        const results = pokemonList.filter((pokemon) => isSelectablePokemon(pokemon)
            && (!query || pokemon.name.includes(query) || (Number.isFinite(idQuery) && pokemon.id === idQuery))
            && (!selectedGeneration || utils.generationFor(pokemon.id) === selectedGeneration));
        const pageCount = Math.max(1, Math.ceil(results.length / window.PokedexApp.config.pageSize));
        pickerPage = Math.min(pickerPage, pageCount);
        const start = (pickerPage - 1) * window.PokedexApp.config.pageSize;
        const pageItems = results.slice(start, start + window.PokedexApp.config.pageSize);

        pickerGrid.replaceChildren();
        pickerRetry.hidden = true;
        pickerPagination.hidden = results.length <= window.PokedexApp.config.pageSize;
        pickerPrev.disabled = pickerPage <= 1;
        pickerNext.disabled = pickerPage >= pageCount;
        pickerPageLabel.textContent = `Página ${pickerPage} de ${pageCount}`;

        if (!results.length) {
            pickerCount.textContent = "Nenhum Pokémon encontrado.";
            return;
        }

        pickerCount.textContent = "Carregando Pokémon...";
        try {
            const details = await Promise.all(pageItems.map(({ id }) => api.getPokemon(id)));
            if (requestVersion !== pickerRequestVersion || !pickerTarget) return;
            pageItems.forEach((entry, index) => pickerGrid.append(renderPickerCard(entry, details[index])));
            pickerCount.textContent = `${results.length.toLocaleString("pt-BR")} Pokémon encontrados.`;
        } catch (error) {
            if (requestVersion !== pickerRequestVersion) return;
            console.error("Erro ao carregar a página da Pokédex:", error);
            pickerCount.textContent = "Não foi possível carregar estes Pokémon.";
            pickerRetry.hidden = false;
        }
    }

    function showPickerMode(mode) {
        pickerMode = mode;
        pokemonListView.hidden = mode !== "list";
        pokemonDetailView.hidden = mode !== "details";
        itemPickerView.hidden = mode !== "items";
        movePickerView.hidden = mode !== "moves";
        const titles = {
            list: "Escolher Pokémon",
            details: "Preparar Pokémon",
            items: "Escolher item",
            moves: "Escolher golpes"
        };
        pickerTitle.textContent = titles[mode];
        pickerContext.textContent = {
            list: "Selecione um Pokémon para configurar seu time.",
            details: "Confira o Pokémon e defina item e golpes.",
            items: "Escolha o item que este Pokémon vai segurar.",
            moves: "Selecione quatro golpes para este Pokémon."
        }[mode];
    }

    function renderPokemonDetail() {
        if (!pendingPokemon) return;
        const { entry, pokemon } = pendingPokemon;
        const statLabels = {
            hp: "HP",
            attack: "Ataque",
            defense: "Defesa",
            "special-attack": "Ataque especial",
            "special-defense": "Defesa especial",
            speed: "Velocidade"
        };
        const types = pokemon.types.map(({ type }) =>
            `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`).join("");
        const stats = pokemon.stats.map(({ stat, base_stat }) => {
            const label = statLabels[stat.name] || stat.name.replace(/-/g, " ");
            const percentage = Math.min(255, Math.max(0, base_stat)) / 255 * 100;
            return `<div class="pokemon-base-stat-row">
                <span class="pokemon-base-stat-label">${escapeHTML(label)}</span>
                <div class="pokemon-base-stat-track" role="meter" aria-label="${escapeHTML(label)}"
                    aria-valuemin="0" aria-valuemax="255" aria-valuenow="${base_stat}">
                    <span style="width: ${percentage.toFixed(1)}%"></span>
                </div>
            </div>`;
        }).join("");
        pokemonDetailCard.innerHTML = `<div class="pokemon-detail-card">
            <div class="pokemon-detail-art">
                <img src="${escapeHTML(imageUrl(pokemon))}" alt="${formatName(entry.name)}">
            </div>
            <div class="pokemon-detail-info">
                <span class="pokemon-number">#${String(entry.id).padStart(4, "0")}</span>
                <div class="pokemon-detail-name-row">
                    <h3>${formatName(entry.name)}</h3>
                    <button class="held-item-slot" type="button" data-choose-held-item
                        aria-label="${pendingHeldItem ? `Trocar item ${plainName(pendingHeldItem.replace(/_/g, "-"))}` : "Escolher item"}">
                        ${pendingHeldItem
                            ? `<img src="${escapeHTML(itemSpriteUrl(pendingHeldItem))}" alt=""
                                onerror="this.hidden = true">`
                            : '<span aria-hidden="true">+</span>'}
                    </button>
                </div>
                <div class="type-list">${types}</div>
                <p class="pokemon-base-chart-title">Atributos base</p>
                <div class="pokemon-detail-stats">${stats}</div>
            </div>
        </div>`;
        pokemonDetailCard.querySelector("[data-choose-held-item]").addEventListener("click", openItemPicker);
        pendingMoveButtons.innerHTML = Array.from({ length: 4 }, (_, index) => {
            const moveName = pendingMoves[index];
            const moveDetails = moveName ? pendingMoveDetails[moveName] : null;
            const moveType = moveDetails?.type?.name;
            return `<button class="pokemon-move-button${moveType ? "" : " is-empty"}" type="button" data-open-move-picker
                aria-label="${moveName ? `Editar golpe ${index + 1}: ${plainName(moveName)}` : `Escolher golpe ${index + 1}`}">
                <span class="pokemon-move-slot-label">Golpe ${index + 1}</span>
                <strong>${moveName ? formatName(moveName) : "Escolher golpe"}</strong>
                ${moveType ? `<span class="type-tag type-${escapeHTML(moveType)}">${typeLabel(moveType)}</span>` : ""}
            </button>`;
        }).join("");
        pendingMoveButtons.querySelectorAll("[data-open-move-picker]").forEach((button) => {
            button.addEventListener("click", openMovePicker);
        });
        const canConfirm = teamModes[pickerTarget.teamIndex] !== "manual" || pendingMoves.length === 4;
        const currentSelection = pokemonTeams[pickerTarget.teamIndex][pickerTarget.slotIndex];
        document.querySelector("#confirm-pokemon-selection").disabled = !canConfirm;
        document.querySelector("#confirm-pokemon-selection").textContent =
            currentSelection ? "Salvar configuração" : "Adicionar ao time";
        pokemonDetailMessage.textContent = canConfirm
            ? ""
            : "No modo manual, escolha quatro golpes antes de adicionar o Pokémon.";
    }

    function previewPokemon(entry, pokemon) {
        if (!pickerTarget) return;
        const currentSlot = pokemonTeams[pickerTarget.teamIndex][pickerTarget.slotIndex];
        const isCurrentSelection = currentSlot?.entry.id === entry.id;
        pendingPokemon = { entry, pokemon };
        pendingHeldItem = isCurrentSelection ? currentSlot.heldItem : null;
        pendingMoves = isCurrentSelection ? [...currentSlot.selectedMoves] : [];
        pendingMoveDetails = isCurrentSelection ? { ...currentSlot.moveDetails } : {};
        pokemonDetailMessage.textContent = "";
        showPickerMode("details");
        renderPokemonDetail();
    }

    function openPokemonPicker(teamIndex, slotIndex) {
        pickerTarget = { teamIndex, slotIndex };
        pendingPokemon = null;
        pendingHeldItem = null;
        pendingMoves = [];
        pendingMoveDetails = {};
        pickerPage = 1;
        pickerSearch.value = "";
        clearTimeout(pickerSearchTimer);
        showPickerMode("list");
        pickerDialog.showModal();
        renderPokemonPicker();
        pickerSearch.focus();
    }

    function openPokemonSlot(teamIndex, slotIndex) {
        const slot = pokemonTeams[teamIndex][slotIndex];
        if (!slot?.pokemon) {
            openPokemonPicker(teamIndex, slotIndex);
            return;
        }
        pickerTarget = { teamIndex, slotIndex };
        pendingPokemon = { entry: slot.entry, pokemon: slot.pokemon };
        pendingHeldItem = slot.heldItem;
        pendingMoves = [...slot.selectedMoves];
        pendingMoveDetails = { ...slot.moveDetails };
        showPickerMode("details");
        pickerDialog.showModal();
        renderPokemonDetail();
    }

    function choosePokemon(entry, pokemon) {
        previewPokemon(entry, pokemon);
    }

    function openItemPicker() {
        showPickerMode("items");
        itemPickerGrid.innerHTML = itemsForPokemon(pendingPokemon.entry.name).map(({ name, title, description }) => {
            const selected = (pendingHeldItem || "") === name;
            const image = name
                ? `<img src="${escapeHTML(itemSpriteUrl(name))}" alt="" onerror="this.hidden = true">`
                : '<span class="item-picker-empty-icon" aria-hidden="true">—</span>';
            return `<button class="item-picker-option ${selected ? "is-selected" : ""}" type="button"
                data-held-item="${escapeHTML(name)}" aria-pressed="${selected}">
                ${image}
                <span class="item-picker-option-copy">
                    <strong>${escapeHTML(title)}</strong>
                    <small>${escapeHTML(description)}</small>
                </span>
                <span class="item-picker-check">${selected ? "Selecionado" : "Escolher"}</span>
            </button>`;
        }).join("");
        itemPickerGrid.querySelectorAll("[data-held-item]").forEach((button) => {
            button.addEventListener("click", () => {
                const item = button.dataset.heldItem || null;
                pendingHeldItem = item;
                showPickerMode("details");
                renderPokemonDetail();
            });
        });
    }

    function openMovePicker() {
        movePickerPage = 1;
        movePickerSearch.value = "";
        movePickerMessage.textContent = "";
        showPickerMode("moves");
        if (!pickerDialog.open) pickerDialog.showModal();
        renderMovePicker();
        movePickerSearch.focus();
    }

    async function renderMovePicker() {
        if (pickerMode !== "moves" || !pendingPokemon) return;
        const requestVersion = ++movePickerRequestVersion;
        const query = movePickerSearch.value.trim().toLowerCase();
        const allMoves = uniqueMoves(pendingPokemon.pokemon.moves);
        const results = allMoves.filter(({ move }) => !query || move.name.includes(query));
        const pageSize = window.PokedexApp.config.pageSize;
        const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
        movePickerPage = Math.min(movePickerPage, pageCount);
        const pageItems = results.slice((movePickerPage - 1) * pageSize, movePickerPage * pageSize);
        movePickerList.replaceChildren();
        movePickerPagination.hidden = results.length <= pageSize;
        movePickerPrev.disabled = movePickerPage <= 1;
        movePickerNext.disabled = movePickerPage >= pageCount;
        movePickerPageLabel.textContent = `Página ${movePickerPage} de ${pageCount}`;
        movePickerConfirm.textContent = `Concluir escolha (${pendingMoves.length}/4)`;
        movePickerConfirm.disabled = pendingMoves.length !== 4;
        movePickerMessage.textContent = "";
        if (!results.length) {
            movePickerCount.textContent = "Nenhum golpe encontrado.";
            return;
        }
        movePickerCount.textContent = `Carregando golpes... ${pendingMoves.length}/4 selecionados`;
        try {
            const details = await mapWithConcurrency(pageItems, 6, ({ move }) => api.getMove(move.url));
            if (requestVersion !== movePickerRequestVersion || pickerMode !== "moves") return;
            pageItems.forEach((entry, index) => {
                const detailsForMove = details[index];
                const moveName = entry.move.name;
                if (pendingMoves.includes(moveName)) pendingMoveDetails[moveName] = detailsForMove;
                const selected = pendingMoves.includes(moveName);
                const button = document.createElement("button");
                button.type = "button";
                button.className = `move-picker-option ${selected ? "is-selected" : ""}`;
                button.setAttribute("aria-pressed", String(selected));
                button.innerHTML = `<span class="move-picker-option-state">${selected ? "✓" : "+"}</span>
                    ${renderMovePreview(detailsForMove)}`;
                button.addEventListener("click", () => {
                    const selectedIndex = pendingMoves.indexOf(moveName);
                    if (selectedIndex >= 0) {
                        pendingMoves.splice(selectedIndex, 1);
                    } else if (pendingMoves.length >= 4) {
                        movePickerMessage.textContent = "Você já selecionou quatro golpes. Remova um antes de escolher outro.";
                        return;
                    } else {
                        pendingMoves.push(moveName);
                    }
                    pendingMoveDetails[moveName] = detailsForMove;
                    renderPokemonDetail();
                    renderMovePicker();
                });
                movePickerList.append(button);
            });
            movePickerCount.textContent = `${results.length.toLocaleString("pt-BR")} golpes disponíveis · ${pendingMoves.length}/4 selecionados`;
            movePickerConfirm.textContent = `Concluir escolha (${pendingMoves.length}/4)`;
            movePickerConfirm.disabled = pendingMoves.length !== 4;
        } catch (error) {
            if (requestVersion !== movePickerRequestVersion) return;
            console.error(`Erro ao carregar golpes de ${pendingPokemon.entry.name}:`, error);
            movePickerCount.textContent = "Não foi possível carregar os detalhes dos golpes.";
            movePickerMessage.textContent = "Verifique sua conexão e tente novamente.";
        }
    }

    function confirmMoveSelection() {
        if (pendingMoves.length !== 4) {
            movePickerMessage.textContent = "Escolha exatamente quatro golpes para continuar.";
            return;
        }
        showPickerMode("details");
        renderPokemonDetail();
    }

    function confirmPokemonSelection() {
        if (!pickerTarget || !pendingPokemon) return;
        if (teamModes[pickerTarget.teamIndex] === "manual" && pendingMoves.length !== 4) {
            pokemonDetailMessage.textContent = "Escolha quatro golpes antes de adicionar o Pokémon ao time.";
            return;
        }
        const { teamIndex, slotIndex } = pickerTarget;
        const selection = {
            ...pendingPokemon,
            heldItem: pendingHeldItem,
            selectedMoves: pendingMoves,
            moveDetails: pendingMoveDetails
        };
        pickerDialog.close();
        selectPokemon(teamIndex, slotIndex, selection);
    }

    function validateTeams(teamIndices = [0, 1]) {
        for (const teamIndex of teamIndices) {
            const slots = pokemonTeams[teamIndex];
            if (slots.some((slot) => !slot || !slot.pokemon)) {
                setSetupMessage(`Complete os seis Pokémon do Time ${teamIndex + 1} e aguarde o carregamento.`, true);
                return false;
            }
            if (new Set(slots.map((slot) => slot.entry.id)).size !== 6) {
                setSetupMessage(`Cada Pokémon do Time ${teamIndex + 1} deve ser diferente.`, true);
                return false;
            }
            if (teamModes[teamIndex] === "manual" && slots.some((slot) => {
                const selectedMoves = Array.from({ length: 4 }, (_, index) => slot.selectedMoves[index]);
                return selectedMoves.some((name) => !name) || new Set(selectedMoves).size !== 4;
            })) {
                setSetupMessage(`Escolha quatro golpes diferentes para cada Pokémon do Time ${teamIndex + 1}.`, true);
                return false;
            }
        }
        return true;
    }

    function chooseMoves(slot, mode) {
        const available = uniqueMoves(slot.pokemon.moves);
        if (mode === "automatic") return automaticMoves(available);
        if (mode === "random") return randomMoves(available);
        return slot.selectedMoves
            .map((name) => available.find(({ move }) => move.name === name))
            .filter(Boolean);
    }

    async function mapWithConcurrency(items, limit, callback) {
        const results = new Array(items.length);
        let nextIndex = 0;
        const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (nextIndex < items.length) {
                const index = nextIndex++;
                results[index] = await callback(items[index], index);
            }
        });
        await Promise.all(workers);
        return results;
    }

    function statValue(pokemon, statName) {
        return pokemon.stats.find(({ stat }) => stat.name === statName)?.base_stat || 1;
    }

    function calculateBattleHp(pokemon) {
        const baseHp = statValue(pokemon, "hp");
        return Math.floor((2 * baseHp * BATTLE_LEVEL) / 100) + BATTLE_LEVEL + 10;
    }

    async function startBattle() {
        if (onlineMode && !onlineTeamsLoading) {
            await submitOnlineTeam();
            return;
        }
        if (!validateTeams()) return;

        startButton.disabled = true;
        startButton.textContent = "Preparando...";
        setSetupMessage("Carregando golpes e regras de tipo...", false);
        try {
            const chosenMoves = pokemonTeams.map((team, teamIndex) =>
                team.map((slot) => chooseMoves(slot, teamModes[teamIndex])));
            const megaForms = new Map(pokemonList.map((entry) => [entry.name, entry]));
            const selectedMegaNames = pokemonTeams.flatMap((team) =>
                team.map((slot) => MEGA_STONES[slot.heldItem]).filter(Boolean));
            const uniqueMegaNames = [...new Set(selectedMegaNames)];
            const megaDetails = await mapWithConcurrency(uniqueMegaNames, 6, async (name) => {
                const entry = megaForms.get(name);
                if (!entry) throw new Error(`Forma Mega indisponível: ${name}`);
                return [name, await api.getPokemon(entry.id)];
            });
            const megaPokemonByName = new Map(megaDetails);
            const eviolitePokemon = pokemonTeams.flatMap((team) =>
                team.map((slot) => slot.heldItem === "eviolite" ? slot.pokemon : null).filter(Boolean));
            const evioliteEligibility = await mapWithConcurrency(
                eviolitePokemon, 6, async (pokemon) => [pokemon.species.name, await isEvioliteEligible(pokemon)]
            );
            const evioliteEligibilityBySpecies = new Map(evioliteEligibility);
            const allMoves = chosenMoves.reduce((all, team) => all.concat(...team), []);
            const uniqueMoveEntries = [...new Map(allMoves.map((entry) => [entry.move.url, entry])).values()];
            const typeNames = ALL_TYPE_NAMES;
            const missingTypeNames = typeNames.filter((type) => !typeDetailCache.has(type));
            const [moveDetails, typeDetails] = await Promise.all([
                mapWithConcurrency(uniqueMoveEntries, 8, ({ move }) => api.getMove(move.url)),
                mapWithConcurrency(missingTypeNames, 6, (type) => api.getType(type))
            ]);
            missingTypeNames.forEach((type, index) => typeDetailCache.set(type, typeDetails[index]));
            const moveDetailsByUrl = new Map(uniqueMoveEntries.map((entry, index) =>
                [entry.move.url, moveDetails[index]]));
            const typeDetailsByName = new Map(typeNames.map((type) =>
                [type, typeDetailCache.get(type)]));
            const teams = pokemonTeams.map((team, teamIndex) => ({
                name: playerNames[teamIndex].trim() || `Jogador ${teamIndex + 1}`,
                members: team.map((slot, slotIndex) => {
                    const maxHp = calculateBattleHp(slot.pokemon);
                    const moves = chosenMoves[teamIndex][slotIndex].map(({ move }) => {
                        const details = moveDetailsByUrl.get(move.url);
                        if (!details) throw new Error(`Dados indisponíveis para o golpe ${move.name}`);
                        return details;
                    });
                    return {
                        teamIndex,
                        entry: slot.entry,
                        pokemon: slot.pokemon,
                        basePokemon: slot.pokemon,
                        megaPokemon: MEGA_STONES[slot.heldItem]
                            ? megaPokemonByName.get(MEGA_STONES[slot.heldItem])
                            : null,
                        heldItem: slot.heldItem || null,
                        evioliteEligible: evioliteEligibilityBySpecies.get(slot.pokemon.species.name) || false,
                        megaEvolved: false,
                        originalTypes: slot.pokemon.types.map(({ type }) => type.name),
                        currentTypes: slot.pokemon.types.map(({ type }) => type.name),
                        moves,
                        originalMoves: [...moves],
                        maxHp,
                        currentHp: maxHp,
                        statStages: {},
                        criticalStage: 0,
                        status: null,
                        confusionTurns: 0,
                        flinchedTurn: null,
                        protectionChain: 0,
                        lastProtectionTurn: null,
                        protectedTurn: null,
                        enduredTurn: null,
                        moveEffects: {},
                        entryTurn: 1,
                        damageTakenThisTurn: 0,
                        lastDamageClassThisTurn: null
                    };
                })
            }));

            game = {
                format: Number(document.querySelector("#battle-format").value),
                teams,
                typeDetails: typeDetailsByName,
                active: [0, 1].map(() => Array.from(
                    { length: Number(document.querySelector("#battle-format").value) },
                    (_, index) => index
                )),
                pendingActions: [[], []],
                pendingMega: new Set(),
                megaUsed: [false, false],
                pendingTarget: null,
                lastExecutedMove: null,
                currentPlayer: 0,
                turn: 1,
                log: ["A batalha começou!"],
                winner: null,
                visualEffects: null,
                fieldEffects: {
                    trickRoomTurns: 0,
                    tailwindTurns: [0, 0],
                    wishes: [[], []],
                    wideGuardTurn: [null, null],
                    quickGuardTurn: [null, null],
                    matBlockTurn: [null, null],
                    weather: { name: null, turns: 0 },
                    terrain: { name: null, turns: 0 },
                    screens: {
                        reflect: [0, 0],
                        lightScreen: [0, 0],
                        auroraVeil: [0, 0]
                    },
                    safeguardTurns: [0, 0],
                    mistTurns: [0, 0],
                    luckyChantTurns: [0, 0],
                    hazards: Array.from({ length: 2 }, () => ({
                        stealthRock: false,
                        spikes: 0,
                        toxicSpikes: 0,
                        stickyWeb: false
                    })),
                    gravityTurns: 0,
                    wonderRoomTurns: 0,
                    magicRoomTurns: 0,
                    mudSportTurns: 0,
                    waterSportTurns: 0,
                    ionDelugeTurn: null,
                    fairyLockTurn: null,
                    craftyShieldTurn: [null, null]
                },
                currentResolution: null
            };
            onlineBattleStarted = onlineMode;
            onlineBattleReady = false;
            onlineWaitingForState = onlineMode;
            renderedLogLength = 0;
            battleLog.replaceChildren();
            setupView.hidden = true;
            battleView.hidden = false;
            renderBattle();
            battleView.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            console.error("Erro ao preparar a batalha:", error);
            onlineBattleStarted = false;
            setSetupMessage("Não foi possível preparar a batalha. Verifique a conexão e tente novamente.", true);
        } finally {
            startButton.disabled = false;
            updateOnlineLobby();
        }
    }

    function renderArenaPokemon(teamIndex, activeSlot) {
        const memberIndex = game.active[teamIndex][activeSlot];
        if (memberIndex === null) {
            return `<article class="arena-pokemon arena-pokemon-empty">
                <span>Sem Pokémon ativo</span>
            </article>`;
        }

        const member = game.teams[teamIndex].members[memberIndex];
        const percent = Math.max(0, Math.round(member.currentHp / member.maxHp * 100));
        const effectKey = `${teamIndex}:${memberIndex}`;
        const effects = game.visualEffects;
        const itemEffect = effects?.itemEffects.get(effectKey);
        const isCurrentAttacker = game.currentResolution?.teamIndex === teamIndex
            && game.currentResolution?.attackerIndex === memberIndex;
        const hpBefore = effects?.damagedBefore.get(effectKey)
            ?? effects?.healedBefore.get(effectKey)
            ?? member.currentHp;
        const critical = percent <= 25;
        const types = getMemberTypeNames(member)
            .map((type) => `<span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>`).join("")
            || '<span class="type-tag">Sem tipo</span>';
        const displayName = member.megaEvolved ? member.pokemon.name : member.entry.name;
        return `<article class="arena-pokemon ${isCurrentAttacker ? "is-current-attacker" : ""} ${effects?.attackers.has(effectKey) ? "is-attacking" : ""} ${effects?.hitMembers.has(effectKey) ? "is-hit" : ""} ${effects?.healedMembers.has(effectKey) ? "is-item-healing" : ""} ${itemEffect ? `is-item-${itemEffect.kind}` : ""} ${effects?.megaEvolved.has(effectKey) ? "is-mega-evolving" : ""} ${critical ? "is-critical" : ""}"
            data-team-index="${teamIndex}" data-active-slot="${activeSlot}">
            <div class="arena-pokemon-art">
                <img src="${escapeHTML(imageUrl(member.pokemon))}" alt="${formatName(displayName)}">
                ${itemEffect ? `<span class="item-effect-burst is-${itemEffect.kind}">${escapeHTML(itemEffect.label)}</span>` : ""}
            </div>
            <div class="arena-pokemon-info">
                <span class="arena-pokemon-number">#${String(member.entry.id).padStart(4, "0")}</span>
                <strong class="arena-pokemon-name">${formatName(displayName)}</strong>
                ${member.heldItem ? `<span class="arena-held-item">
                    <img src="${escapeHTML(itemSpriteUrl(member.heldItem))}" alt="" onerror="this.hidden = true">
                    ${formatName(member.heldItem.replace(/_/g, "-"))}
                </span>` : ""}
                <span class="arena-pokemon-types">${types}</span>
                <div class="battle-hp-track"><span class="battle-hp-fill ${critical ? "low" : ""} ${effects?.hitMembers.has(effectKey) ? "hp-draining" : ""} ${effects?.healedMembers.has(effectKey) ? "hp-restoring" : ""}"
                    style="--hp-from:${hpBefore / member.maxHp};--hp-to:${member.currentHp / member.maxHp}"></span></div>
                <span class="arena-hp-text ${critical ? "is-critical" : ""}">${member.currentHp}/${member.maxHp} HP</span>
            </div>
        </article>`;
    }

    function teamDisplayName(teamIndex) {
        const teamName = game.teams[teamIndex].name;
        const defaultName = `Jogador ${teamIndex + 1}`;
        return teamName === defaultName ? `Time ${teamIndex + 1}` : teamName;
    }

    function renderBattleTeam(teamIndex) {
        const team = game.teams[teamIndex];
        const activePokemon = game.active[teamIndex]
            .map((_, activeSlot) => renderArenaPokemon(teamIndex, activeSlot))
            .join("");
        const pokeballs = team.members.map((member, memberIndex) => {
            const defeated = member.currentHp <= 0;
            const active = game.active[teamIndex].includes(memberIndex);
            const status = defeated ? "derrotado" : active ? "ativo" : "disponível";
            const label = `${formatName(member.entry.name)}: ${status}, ${member.currentHp}/${member.maxHp} HP`;
            return `<span class="team-pokeball ${defeated ? "is-defeated" : active ? "is-active" : "is-available"}"
                role="img" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">
                <span class="team-pokeball-center" aria-hidden="true"></span>
            </span>`;
        }).join("");
        return `<section class="arena-side arena-team-${teamIndex + 1}">
            <div class="arena-side-heading">
                <h3>${escapeHTML(teamDisplayName(teamIndex))}</h3>
                <div class="team-pokeballs" role="group" aria-label="Pokémon do time ${teamIndex + 1}">
                    ${pokeballs}
                </div>
            </div>
            <div class="arena-active-row">${activePokemon}</div>
        </section>`;
    }

    function renderFieldEffects() {
        const effects = [];
        const addTimedEffect = (label, turns) => {
            if (turns > 0) effects.push(`${label} · ${turns} turnos`);
        };
        if (game.fieldEffects.trickRoomTurns > 0) {
            effects.push(`Trick Room · ${game.fieldEffects.trickRoomTurns} turnos`);
        }
        game.fieldEffects.tailwindTurns.forEach((turns, teamIndex) => {
            addTimedEffect(`${teamDisplayName(teamIndex)} · Tailwind`, turns);
        });
        if (game.fieldEffects.weather.turns > 0) {
            const weatherLabels = { rain: "Chuva", sun: "Sol", sandstorm: "Tempestade de areia", hail: "Granizo", snow: "Neve" };
            addTimedEffect(weatherLabels[game.fieldEffects.weather.name], game.fieldEffects.weather.turns);
        }
        if (game.fieldEffects.terrain.turns > 0) {
            const terrainLabels = { electric: "Campo elétrico", grassy: "Campo de grama", misty: "Campo enevoado", psychic: "Campo psíquico" };
            addTimedEffect(terrainLabels[game.fieldEffects.terrain.name], game.fieldEffects.terrain.turns);
        }
        game.teams.forEach((_, teamIndex) => {
            const teamScreens = game.fieldEffects.screens;
            const label = teamDisplayName(teamIndex);
            addTimedEffect(`${label} · Reflect`, teamScreens.reflect[teamIndex]);
            addTimedEffect(`${label} · Light Screen`, teamScreens.lightScreen[teamIndex]);
            addTimedEffect(`${label} · Aurora Veil`, teamScreens.auroraVeil[teamIndex]);
            addTimedEffect(`${label} · Safeguard`, game.fieldEffects.safeguardTurns[teamIndex]);
            addTimedEffect(`${label} · Mist`, game.fieldEffects.mistTurns[teamIndex]);
            addTimedEffect(`${label} · Lucky Chant`, game.fieldEffects.luckyChantTurns[teamIndex]);
        });
        game.fieldEffects.hazards.forEach((hazards, teamIndex) => {
            const active = [];
            if (hazards.stealthRock) active.push("Stealth Rock");
            if (hazards.spikes) active.push(`Spikes ×${hazards.spikes}`);
            if (hazards.toxicSpikes) active.push(`Toxic Spikes ×${hazards.toxicSpikes}`);
            if (hazards.stickyWeb) active.push("Sticky Web");
            if (active.length) effects.push(`${teamDisplayName(teamIndex)} · ${active.join(", ")}`);
        });
        addTimedEffect("Gravity", game.fieldEffects.gravityTurns);
        addTimedEffect("Wonder Room", game.fieldEffects.wonderRoomTurns);
        addTimedEffect("Magic Room", game.fieldEffects.magicRoomTurns);
        addTimedEffect("Mud Sport", game.fieldEffects.mudSportTurns);
        addTimedEffect("Water Sport", game.fieldEffects.waterSportTurns);
        if (!effects.length) return "";
        return `<div class="battle-field-effects" aria-label="Efeitos de campo ativos">
            ${effects.map((effect) => `<span>${escapeHTML(effect)}</span>`).join("")}
        </div>`;
    }

    function renderBattleOrder() {
        const current = game.currentResolution;
        if (!current) return "";
        const position = current.total === 1
            ? "Único ataque do turno"
            : current.order === 1
                ? "Ataca primeiro"
                : current.order === current.total
                    ? "Ataca por último"
                    : `Ataca em ${current.order}º lugar`;
        const priority = current.priority === 0
            ? "Prioridade normal"
            : `Prioridade ${current.priority > 0 ? "+" : ""}${current.priority}`;
        const speedRule = current.trickRoom
            ? `Velocidade ${current.speed} · Trick Room: menor velocidade com prioridades iguais`
            : `Velocidade ${current.speed}`;
        const phase = current.phase === "attacking"
            ? "Atacando"
            : current.phase === "impact"
                ? "Golpe aplicado"
                : current.phase === "complete"
                    ? "Ação concluída"
                    : "Próximo ataque";
        return `<div class="battle-order-banner" role="status" aria-live="polite">
            <span class="battle-order-position">${current.order}/${current.total}</span>
            <span class="battle-order-details">
                <strong>${escapeHTML(formatName(current.pokemonName))} · ${escapeHTML(formatName(current.moveName))}</strong>
                <span>${position} · ${priority} · ${speedRule}</span>
            </span>
            <span class="battle-order-phase">${phase}</span>
        </div>`;
    }

    function renderBattleLog() {
        game.log.slice(renderedLogLength).forEach((message) => {
            const item = document.createElement("li");
            item.textContent = message;
            battleLog.append(item);
        });
        renderedLogLength = game.log.length;
        while (battleLog.children.length > 16) battleLog.firstElementChild.remove();
    }

    function positionTurnControls(teamIndex = game.currentPlayer) {
        const playerSide = battlefield.querySelector(`.arena-team-${teamIndex + 1}`);
        battlefield.querySelectorAll(".arena-side").forEach((side) => {
            side.classList.toggle("is-turn", side === playerSide);
        });
        if (window.matchMedia("(max-width: 650px)").matches) {
            if (battlefield.nextElementSibling !== turnControls) battlefield.after(turnControls);
        } else if (playerSide && turnControls.parentElement !== playerSide) {
            playerSide.append(turnControls);
        }
    }

    function getActiveActors(teamIndex) {
        return game.active[teamIndex]
            .map((memberIndex, activeSlot) => ({
                memberIndex,
                activeSlot,
                member: memberIndex === null ? null : game.teams[teamIndex].members[memberIndex]
            }))
            .filter(({ member }) => member && member.currentHp > 0);
    }

    function getAvailableSwitches(teamIndex) {
        const activeIndices = new Set(game.active[teamIndex].filter((index) => index !== null));
        const selectedSwitches = new Set((game.pendingActions[teamIndex] || [])
            .map(({ switchToIndex }) => switchToIndex)
            .filter(Number.isInteger));
        return game.teams[teamIndex].members
            .map((member, index) => ({ member, index }))
            .filter(({ member, index }) => member.currentHp > 0
                && !activeIndices.has(index)
                && !selectedSwitches.has(index));
    }

    function canVoluntarilySwitch(member) {
        const effects = member.moveEffects || {};
        return !(effects.bindTurns > 0 || effects.permanentTrap || effects.ingrain);
    }

    function getRequiredReplacement() {
        const teamOrder = onlineMode && Number.isInteger(onlineRole)
            ? [onlineRole, 1 - onlineRole]
            : [0, 1];
        for (const teamIndex of teamOrder) {
            const activeSlot = game.active[teamIndex].findIndex((memberIndex) => memberIndex === null);
            if (activeSlot !== -1 && getAvailableSwitches(teamIndex).length > 0) {
                return { teamIndex, activeSlot };
            }
        }
        return null;
    }

    function openSwitchPicker(teamIndex, activeSlot, forced = false, moveName = "", onChosen = null) {
        const currentIndex = game.active[teamIndex][activeSlot];
        if (currentIndex === null && !forced) return;
        const currentMember = currentIndex === null ? null : game.teams[teamIndex].members[currentIndex];
        if (!forced && currentMember && !canVoluntarilySwitch(currentMember)) {
            game.log.push(`${plainName(currentMember.entry.name)} não pode ser trocado agora.`);
            renderBattle();
            return;
        }
        switchTarget = { teamIndex, activeSlot, forced, moveName, onChosen };
        const current = currentMember;
        const available = getAvailableSwitches(teamIndex);
        document.querySelector("#switch-picker-context").textContent = forced
            ? moveName
                ? `${formatName(moveName)} exige uma troca após o golpe. Escolha o Pokémon que entrará.`
                : "Escolha uma reserva para continuar. Essa substituição não consome a ação do próximo turno."
            : `Escolha quem entrará no lugar de ${plainName(current.entry.name)}. A troca consome a ação deste turno.`;
        if (!available.length) {
            switchPickerList.innerHTML = '<p class="switch-picker-empty">Não há Pokémon reservas disponíveis para esta troca.</p>';
        } else {
            switchPickerList.innerHTML = available.map(({ member, index }) => {
                const types = getMemberTypeNames(member)
                    .map((type) => `<span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>`).join("")
                    || '<span class="type-tag">Sem tipo</span>';
                return `<button class="switch-choice" type="button" data-switch-to="${index}">
                    <img src="${escapeHTML(imageUrl(member.pokemon))}" alt="">
                    <span class="switch-choice-info">
                        <strong>#${String(member.entry.id).padStart(4, "0")} ${formatName(member.entry.name)}</strong>
                        <span class="switch-choice-types">${types}</span>
                        <span class="switch-choice-hp">${member.currentHp}/${member.maxHp} HP</span>
                    </span>
                    <span class="switch-choice-label">Escolher</span>
                </button>`;
            }).join("");
            switchPickerList.querySelectorAll("[data-switch-to]").forEach((button) => {
                button.addEventListener("click", () => chooseSwitchPokemon(Number(button.dataset.switchTo)));
            });
        }
        switchDialog.showModal();
    }

    function chooseSwitchPokemon(switchToIndex) {
        if (!switchTarget) return;
        const { teamIndex, activeSlot, forced, moveName, onChosen } = switchTarget;
        if (forced) {
            if (onlineMode && teamIndex !== onlineRole) return;
            if (onlineMode && onlineRole === 1) {
                switchDialog.close();
                onlineForcedSwitchPending = true;
                onlineWaitingForState = true;
                renderActionPanel();
                onlineSocket.emit("battle:forced-switch", {
                    roomCode: onlineRoomCode,
                    activeSlot,
                    switchToIndex,
                    moveName
                }, (response) => {
                    if (response?.ok) return;
                    onlineForcedSwitchPending = false;
                    onlineWaitingForState = false;
                    setOnlineLobbyStatus(response?.error || "Não foi possível enviar a troca.", true);
                    renderActionPanel();
                });
                return;
            }
            const team = game.teams[teamIndex];
            const outgoingIndex = game.active[teamIndex][activeSlot];
            const outgoing = team.members[outgoingIndex];
            const incoming = team.members[switchToIndex];
            if (outgoing) {
                if (moveName === "baton-pass") {
                    incoming.statStages = { ...outgoing.statStages };
                    incoming.confusionTurns = outgoing.confusionTurns;
                } else {
                    outgoing.statStages = {};
                }
                outgoing.confusionTurns = 0;
                outgoing.moveEffects = {};
                setMemberTypeNames(outgoing, memberResetTypes(outgoing));
                outgoing.moves = [...outgoing.originalMoves];
                outgoing.transformedStats = null;
                outgoing.protectionChain = 0;
                outgoing.criticalStage = 0;
            }
            switchDialog.close();
            game.active[teamIndex][activeSlot] = switchToIndex;
            incoming.entryTurn = game.turn;
            game.log.push(moveName && outgoing
                ? `${plainName(outgoing.entry.name)} saiu após ${formatName(moveName)}; ${plainName(incoming.entry.name)} entrou.`
                : `${teamDisplayName(teamIndex)} enviou ${plainName(incoming.entry.name)} para a batalha.`);
            applyEntryHazards(teamIndex, switchToIndex);
            if (onChosen) {
                onChosen();
                return;
            }
            renderBattle();
            if (onlineMode && onlineRole === 0) sendOnlineBattleState();
            return;
        }

        const attackerIndex = game.active[teamIndex][activeSlot];
        switchDialog.close();
        game.teams[teamIndex].members[attackerIndex].statStages = {};
        game.teams[teamIndex].members[attackerIndex].moveEffects = {};
        setMemberTypeNames(
            game.teams[teamIndex].members[attackerIndex],
            memberResetTypes(game.teams[teamIndex].members[attackerIndex])
        );
        game.teams[teamIndex].members[attackerIndex].moves =
            [...game.teams[teamIndex].members[attackerIndex].originalMoves];
        game.teams[teamIndex].members[attackerIndex].transformedStats = null;
        game.teams[teamIndex].members[attackerIndex].protectionChain = 0;
        game.teams[teamIndex].members[attackerIndex].criticalStage = 0;
        registerAction({ teamIndex, activeSlot, attackerIndex, switchToIndex });
    }

    function canSelectBattleTarget(action, teamIndex) {
        const targetName = action.move.target?.name;
        if (action.move.name === "after-you") return teamIndex === action.teamIndex;
        if (["user-or-ally", "ally"].includes(targetName)) return teamIndex === action.teamIndex;
        if (targetName !== "selected-pokemon") return teamIndex !== action.teamIndex;
        if (action.move.name === "pollen-puff") return true;
        if (action.move.meta?.category?.name === "heal") return teamIndex === action.teamIndex;
        if (["swagger", "flatter", "psych-up"].includes(action.move.name)) return true;
        return teamIndex !== action.teamIndex;
    }

    function setTargetSelection(enabled) {
        battlefield.querySelectorAll(".arena-pokemon[data-team-index]").forEach((pokemonCard) => {
            const teamIndex = Number(pokemonCard.dataset.teamIndex);
            const activeSlot = Number(pokemonCard.dataset.activeSlot);
            const memberIndex = game.active[teamIndex][activeSlot];
            const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
            const pending = game.pendingTarget;
            const sameAsAttacker = teamIndex === pending?.teamIndex && activeSlot === pending?.activeSlot;
            const canTargetTeam = pending && canSelectBattleTarget(pending, teamIndex);
            const isTargetable = enabled
                && canTargetTeam
                && !sameAsAttacker
                && member
                && member.currentHp > 0;

            pokemonCard.classList.toggle("is-targetable", Boolean(isTargetable));
            if (!isTargetable) {
                pokemonCard.removeAttribute("role");
                pokemonCard.removeAttribute("tabindex");
                pokemonCard.removeAttribute("aria-label");
                return;
            }

            pokemonCard.setAttribute("role", "button");
            pokemonCard.setAttribute("tabindex", "0");
            pokemonCard.setAttribute("aria-label", `Selecionar ${formatName(member.entry.name)} como alvo`);
        });
    }

    function registerBattleTarget(pokemonCard) {
        if (!game.pendingTarget) return;

        const teamIndex = Number(pokemonCard.dataset.teamIndex);
        const activeSlot = Number(pokemonCard.dataset.activeSlot);
        const action = game.pendingTarget;
        const canTargetTeam = canSelectBattleTarget(action, teamIndex);
        if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex > 1
            || !canTargetTeam || !Number.isInteger(activeSlot)
            || (teamIndex === action.teamIndex && activeSlot === action.activeSlot)) return;

        const memberIndex = game.active[teamIndex][activeSlot];
        const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
        if (!member || member.currentHp <= 0) return;

        game.pendingTarget = null;
        registerAction({ ...action, targetTeamIndex: teamIndex, targetActiveSlot: activeSlot });
    }

    function renderActionPanel() {
        positionTurnControls();
        setTargetSelection(false);
        if (game.winner !== null) {
            const result = game.winner === -1 ? "Empate!" : `${escapeHTML(teamDisplayName(game.winner))} venceu!`;
            turnControls.innerHTML = `<div class="battle-pass-panel">
                <h3 class="battle-result">${result}</h3>
                <p>${game.winner === -1 ? "As duas equipes ficaram sem Pokémon disponíveis." : "A equipe adversária ficou sem Pokémon disponíveis."}</p>
                <button class="battle-pass-button" id="new-match" type="button">Voltar aos times</button>
            </div>`;
            document.querySelector("#new-match").addEventListener("click", returnToSetup);
            return;
        }

        if (onlineMode && !onlineBattleReady) {
            renderOnlineWaiting("Aguardando os dois jogadores carregarem a batalha...");
            return;
        }
        const requiredReplacement = getRequiredReplacement();
        if (requiredReplacement) {
            const { teamIndex, activeSlot } = requiredReplacement;
            if (onlineMode && teamIndex !== onlineRole) {
                renderOnlineWaiting("Aguardando o adversário escolher um Pokémon reserva...");
                return;
            }
            positionTurnControls(teamIndex);
            turnControls.innerHTML = `<section class="turn-action-panel">
                <h3>${escapeHTML(teamDisplayName(teamIndex))} · escolha uma reserva</h3>
                <button class="battle-secondary-button" type="button" data-required-switch>Escolher Pokémon</button>
            </section>`;
            turnControls.querySelector("[data-required-switch]").addEventListener("click", () => {
                openSwitchPicker(teamIndex, activeSlot, true);
            });
            return;
        }

        if (onlineMode && onlineWaitingForState) {
            renderOnlineWaiting(onlineForcedSwitchPending
                ? "Aguardando a entrada do Pokémon..."
                : "Ação enviada. Aguardando a resolução do turno...");
            return;
        }

        if (onlineMode && onlineRole !== game.currentPlayer) {
            renderOnlineWaiting("Aguardando a jogada do adversário...");
            return;
        }

        const teamIndex = game.currentPlayer;
        const actors = getActiveActors(teamIndex);
        const actions = game.pendingActions[teamIndex];
        if (game.pendingTarget) {
            turnControls.innerHTML = `<section class="turn-action-panel">
                <h3>Vez de ${escapeHTML(teamDisplayName(teamIndex))} · selecione o alvo de ${escapeHTML(formatName(game.pendingTarget.move.name))}</h3>
                <button class="battle-secondary-button" type="button" data-cancel-target>Cancelar</button>
            </section>`;
            setTargetSelection(true);
            turnControls.querySelector("[data-cancel-target]").addEventListener("click", () => {
                game.pendingTarget = null;
                renderActionPanel();
            });
            return;
        }

        const actor = actors.find(({ activeSlot }) =>
            !actions.some((action) => action.activeSlot === activeSlot));
        if (!actor) {
            console.error("Estado inválido: não há ação pendente para o jogador ativo.");
            return;
        }

        const { memberIndex, activeSlot, member } = actor;
        const megaKey = `${teamIndex}:${activeSlot}`;
        const megaSelected = game.pendingMega.has(megaKey);
        const canMega = canMegaEvolve(member, teamIndex, activeSlot);
        const moves = member.moves.map((move, moveIndex) => {
            const power = getMovePower(move, member);
            return `
                <button class="move-choice" type="button" data-use-move="${moveIndex}" data-active-slot="${activeSlot}">
                    <span class="move-choice-type type-${escapeHTML(move.type.name)}">${typeLabel(move.type.name)}</span>
                    <strong>${formatName(move.name)}</strong>
                    <span class="move-choice-power">${power ? `${power} de poder` : "Golpe de status"}</span>
                </button>`;
        }).join("");
        const canSwitch = getAvailableSwitches(teamIndex).length > 0;
        const switchLocked = game.fieldEffects.fairyLockTurn === game.turn;
        const actionMarkup = `<article class="turn-action">
                <div class="turn-action-heading">
                    <strong>${formatName(member.entry.name)}</strong>
                </div>
                ${member.megaEvolved ? `<p class="mega-status">${formatName(member.pokemon.name)} está Mega Evoluído.</p>` : ""}
                ${canMega || megaSelected ? `<button class="mega-evolve-button ${megaSelected ? "is-selected" : ""}" type="button"
                    data-toggle-mega="${activeSlot}" aria-pressed="${megaSelected}">
                    ${megaSelected ? "Mega Evolução ativada · clique para cancelar" : `Mega Evoluir com ${formatName(member.heldItem.replace(/_/g, "-"))}`}
                </button>` : ""}
                <div class="move-choice-grid">${moves}</div>
                <button class="switch-button" type="button" data-switch-active="${activeSlot}" ${!canSwitch || switchLocked ? "disabled" : ""}
                    ${switchLocked ? 'title="Fairy Lock impede trocas neste turno"' : ""}>
                    ${switchLocked ? "Trocas bloqueadas por Fairy Lock" : "Trocar Pokémon"}
                </button>
            </article>`;

        turnControls.innerHTML = `<section class="turn-action-panel">
            <h3>Vez de ${escapeHTML(teamDisplayName(teamIndex))} · turno ${game.turn}</h3>
            <div class="turn-action-list">${actionMarkup}</div>
        </section>`;

        turnControls.querySelectorAll("[data-use-move]").forEach((button) => {
            button.addEventListener("click", () => {
                const activeSlot = Number(button.dataset.activeSlot);
                const memberIndex = game.active[teamIndex][activeSlot];
                const member = game.teams[teamIndex].members[memberIndex];
                const megaKey = `${teamIndex}:${activeSlot}`;
                const action = {
                    teamIndex,
                    activeSlot,
                    attackerIndex: memberIndex,
                    move: member.moves[Number(button.dataset.useMove)],
                    megaEvolve: game.pendingMega.has(megaKey)
                };
                const targetName = action.move.target?.name;
                if (action.move.name === "after-you" && game.format === 1) {
                    registerAction({ ...action, targetUnavailable: true });
                    return;
                }
                if (game.format === 1
                    && (targetName === "ally" || action.move.meta?.category?.name === "heal")) {
                    registerAction({ ...action, targetUnavailable: true });
                    return;
                }
                if (game.format === 2
                    && ["selected-pokemon", "user-or-ally", "ally"].includes(targetName)) {
                    game.pendingTarget = action;
                    renderActionPanel();
                } else {
                    const selfTarget = ["user", "user-or-ally", "ally"].includes(targetName);
                    registerAction({
                        ...action,
                        targetTeamIndex: selfTarget ? teamIndex : 1 - teamIndex,
                        targetActiveSlot: selfTarget ? activeSlot : 0
                    });
                }
            });
        });
        turnControls.querySelectorAll("[data-toggle-mega]").forEach((button) => {
            button.addEventListener("click", () => {
                const activeSlot = Number(button.dataset.toggleMega);
                const megaKey = `${teamIndex}:${activeSlot}`;
                if (game.pendingMega.has(megaKey)) game.pendingMega.delete(megaKey);
                else {
                    const memberIndex = game.active[teamIndex][activeSlot];
                    const member = game.teams[teamIndex].members[memberIndex];
                    if (!canMegaEvolve(member, teamIndex, activeSlot)) return;
                    game.pendingMega.add(megaKey);
                }
                renderActionPanel();
            });
        });
        turnControls.querySelectorAll("[data-switch-active]").forEach((button) => {
            button.addEventListener("click", () => {
                const activeSlot = Number(button.dataset.switchActive);
                game.pendingMega.delete(`${teamIndex}:${activeSlot}`);
                openSwitchPicker(teamIndex, activeSlot);
            });
        });
    }

    function renderOnlineWaiting(message) {
        positionTurnControls(Number.isInteger(onlineRole) ? onlineRole : game.currentPlayer);
        turnControls.innerHTML = `<section class="turn-action-panel online-waiting-panel">
            <h3>Partida online</h3>
            <p role="status" aria-live="polite">${escapeHTML(message)}</p>
        </section>`;
    }

    function serializeOnlineActions(actions) {
        return actions.map((action) => ({
            teamIndex: action.teamIndex,
            activeSlot: action.activeSlot,
            attackerIndex: action.attackerIndex,
            moveName: action.move?.name || null,
            targetTeamIndex: Number.isInteger(action.targetTeamIndex) ? action.targetTeamIndex : null,
            targetActiveSlot: Number.isInteger(action.targetActiveSlot) ? action.targetActiveSlot : null,
            targetUnavailable: Boolean(action.targetUnavailable),
            megaEvolve: Boolean(action.megaEvolve),
            switchToIndex: Number.isInteger(action.switchToIndex) ? action.switchToIndex : null
        }));
    }

    function hydrateOnlineActions(teamIndex, payload) {
        if (!Array.isArray(payload) || payload.length !== getActiveActors(teamIndex).length) {
            throw new Error("Quantidade de ações incompatível com o formato da batalha.");
        }
        return payload.map((action) => {
            const activeSlot = Number(action.activeSlot);
            const attackerIndex = Number(action.attackerIndex);
            if (action.teamIndex !== teamIndex
                || !Number.isInteger(activeSlot) || activeSlot < 0 || activeSlot >= game.format
                || game.active[teamIndex][activeSlot] !== attackerIndex) {
                throw new Error("O jogador enviou uma ação para um Pokémon inválido.");
            }
            const member = game.teams[teamIndex].members[attackerIndex];
            const move = action.moveName
                ? member.moves.find((candidate) => candidate.name === action.moveName)
                : null;
            const switchToIndex = Number.isInteger(action.switchToIndex) ? action.switchToIndex : null;
            if ((!move && switchToIndex === null)
                || switchToIndex !== null && !getAvailableSwitches(teamIndex)
                    .some(({ index }) => index === switchToIndex)) {
                throw new Error("O jogador enviou uma ação ou troca inválida.");
            }
            [action.targetTeamIndex, action.targetActiveSlot].forEach((value) => {
                if (value !== null && (!Number.isInteger(value) || value < 0 || value > 1)) {
                    throw new Error("O jogador enviou um alvo inválido.");
                }
            });
            return {
                teamIndex,
                activeSlot,
                attackerIndex,
                move,
                targetTeamIndex: action.targetTeamIndex,
                targetActiveSlot: action.targetActiveSlot,
                targetUnavailable: Boolean(action.targetUnavailable),
                megaEvolve: Boolean(action.megaEvolve),
                ...(switchToIndex !== null ? { switchToIndex } : {})
            };
        });
    }

    function sendOnlineTeamActions(teamIndex) {
        if (!onlineSocket?.connected) {
            onlineWaitingForState = false;
            setOnlineLobbyStatus("A conexão com a sala foi perdida.", true);
            renderActionPanel();
            return;
        }
        onlineSocket.emit("battle:team-actions", {
            roomCode: onlineRoomCode,
            turn: game.turn,
            teamIndex,
            actions: serializeOnlineActions(game.pendingActions[teamIndex])
        }, (response) => {
            if (response?.ok) return;
            onlineWaitingForState = false;
            setOnlineLobbyStatus(response?.error || "Não foi possível enviar as ações.", true);
            renderActionPanel();
        });
    }

    async function handleOnlineTeamActions(payload) {
        if (!onlineBattleStarted || !onlineBattleReady || payload?.turn !== game.turn) return;
        const remoteTeamIndex = onlineRole === 0 ? 1 : 0;
        if (payload?.teamIndex !== remoteTeamIndex) return;
        const actions = hydrateOnlineActions(remoteTeamIndex, payload.actions);
        game.pendingActions[remoteTeamIndex] = actions;
        if (onlineRole === 1) {
            game.currentPlayer = 1;
            onlineWaitingForState = false;
            renderBattle();
            return;
        }
        onlineWaitingForState = false;
        await resolveTurn();
    }

    function serializeOnlineGame() {
        const effects = game.visualEffects;
        return {
            format: game.format,
            teams: game.teams.map((team) => ({
                name: team.name,
                members: team.members.map((member) => {
                    const { entry, pokemon, basePokemon, megaPokemon, moves, originalMoves, ...runtime } = member;
                    return {
                        ...runtime,
                        pokemonName: pokemon.name,
                        moveNames: moves.map(({ name }) => name)
                    };
                })
            })),
            active: game.active,
            megaUsed: game.megaUsed,
            currentPlayer: game.currentPlayer,
            turn: game.turn,
            log: game.log,
            winner: game.winner,
            pendingActions: [[], []],
            pendingMega: [...game.pendingMega],
            pendingTarget: null,
            lastExecutedMove: null,
            fieldEffects: game.fieldEffects,
            currentResolution: game.currentResolution,
            visualEffects: effects ? {
                attackers: [...effects.attackers],
                hitMembers: [...effects.hitMembers],
                damagedBefore: [...effects.damagedBefore],
                itemEffects: [...effects.itemEffects],
                healedMembers: [...effects.healedMembers],
                healedBefore: [...effects.healedBefore],
                megaEvolved: [...effects.megaEvolved]
            } : null
        };
    }

    function applyOnlineGameState(state, isResolving = false) {
        if (!state || !Array.isArray(state.teams) || state.teams.length !== 2
            || state.teams.some((team) => !Array.isArray(team.members) || team.members.length !== 6)) {
            throw new Error("O servidor enviou um estado de batalha inválido.");
        }
        if (isResolving) playOnlineStateSounds(state);
        const typeDetails = game.typeDetails;
        const localTeams = game.teams;
        const knownMoves = new Map(localTeams.flatMap((team) =>
            team.members.flatMap((member) => [...member.originalMoves, ...member.moves]))
            .map((move) => [move.name, move]));
        const teams = state.teams.map((team, teamIndex) => ({
            ...localTeams[teamIndex],
            name: team.name,
            members: team.members.map((snapshot, memberIndex) => {
                const member = localTeams[teamIndex].members[memberIndex];
                const moves = snapshot.moveNames.map((name) => {
                    const move = knownMoves.get(name);
                    if (!move) throw new Error(`O golpe sincronizado ${name} não está disponível.`);
                    return move;
                });
                const { pokemonName, moveNames, ...runtime } = snapshot;
                const pokemon = snapshot.megaEvolved ? member.megaPokemon : member.basePokemon;
                if (!pokemon || pokemon.name !== pokemonName) {
                    throw new Error(`A forma de ${member.entry.name} não corresponde à batalha.`);
                }
                return { ...member, ...runtime, pokemon, moves };
            })
        }));
        game = {
            ...state,
            teams,
            typeDetails,
            pendingMega: new Set(state.pendingMega),
            visualEffects: state.visualEffects ? {
                attackers: new Set(state.visualEffects.attackers),
                hitMembers: new Set(state.visualEffects.hitMembers),
                damagedBefore: new Map(state.visualEffects.damagedBefore),
                itemEffects: new Map(state.visualEffects.itemEffects),
                healedMembers: new Set(state.visualEffects.healedMembers),
                healedBefore: new Map(state.visualEffects.healedBefore),
                megaEvolved: new Set(state.visualEffects.megaEvolved)
            } : null
        };
        renderedLogLength = Math.min(renderedLogLength, game.log.length);
        if (!renderedLogLength) battleLog.replaceChildren();
        setupView.hidden = true;
        battleView.hidden = false;
        renderBattle(isResolving);
    }

    function playOnlineStateSounds(state) {
        if (!soundEffectsEnabled) return;
        const previous = game.visualEffects;
        const effects = state.visualEffects;
        if (state.currentResolution?.phase === "attacking"
            && game.currentResolution?.phase !== "attacking") {
            playSoundEffect("attack");
        }
        if (effects?.hitMembers?.some((key) => !previous?.hitMembers.has(key))) {
            playSoundEffect("hit");
        }
        effects?.itemEffects?.forEach(([key, itemEffect]) => {
            if (previous?.itemEffects.get(key)?.label !== itemEffect.label) {
                playSoundEffect(itemEffect.kind === "heal" ? "heal" : "item");
            }
        });
    }

    function sendOnlineVisualState() {
        if (onlineRole !== 0 || !onlineBattleStarted || !onlineBattleReady || !onlineSocket?.connected) return;
        onlineSocket.emit("battle:visual-state", {
            roomCode: onlineRoomCode,
            state: serializeOnlineGame()
        });
    }

    function sendOnlineBattleState() {
        if (onlineRole !== 0 || !onlineBattleStarted || !onlineSocket?.connected) return;
        onlineSocket.emit("battle:state", {
            roomCode: onlineRoomCode,
            turn: game.turn,
            state: serializeOnlineGame()
        }, (response) => {
            if (!response?.ok) setOnlineLobbyStatus(response?.error || "Falha ao sincronizar a batalha.", true);
        });
    }

    function applyRemoteForcedSwitch(payload) {
        const teamIndex = 1;
        const { activeSlot, switchToIndex } = payload;
        if (payload.roomCode !== onlineRoomCode
            || !Number.isInteger(activeSlot) || activeSlot < 0 || activeSlot >= game.format
            || !getAvailableSwitches(teamIndex).some(({ index }) => index === switchToIndex)) {
            throw new Error("A troca forçada recebida não é válida.");
        }
        const outgoingIndex = game.active[teamIndex][activeSlot];
        const outgoing = outgoingIndex === null ? null : game.teams[teamIndex].members[outgoingIndex];
        if (payload.moveName && !outgoing || !payload.moveName && outgoing) {
            throw new Error("A troca não corresponde ao estado atual do Pokémon.");
        }
        const incoming = game.teams[teamIndex].members[switchToIndex];
        if (outgoing) {
            outgoing.statStages = {};
            outgoing.confusionTurns = 0;
            outgoing.moveEffects = {};
            setMemberTypeNames(outgoing, memberResetTypes(outgoing));
            outgoing.moves = [...outgoing.originalMoves];
            outgoing.transformedStats = null;
            outgoing.protectionChain = 0;
            outgoing.criticalStage = 0;
        }
        game.active[teamIndex][activeSlot] = switchToIndex;
        incoming.entryTurn = game.turn;
        game.log.push(outgoing
            ? `${plainName(outgoing.entry.name)} saiu após ${formatName(payload.moveName)}; ${plainName(incoming.entry.name)} entrou.`
            : `${teamDisplayName(teamIndex)} enviou ${plainName(incoming.entry.name)} para a batalha.`);
        applyEntryHazards(teamIndex, switchToIndex);
        if (pendingForcedSwitchResolution) {
            const resolve = pendingForcedSwitchResolution;
            pendingForcedSwitchResolution = null;
            resolve(true);
            return;
        }
        renderBattle();
        sendOnlineBattleState();
    }

    function registerAction(action) {
        const actions = game.pendingActions[action.teamIndex];
        if (actions.some(({ activeSlot }) => activeSlot === action.activeSlot)) return;
        if (soundEffectsEnabled) getAudioContext();
        game.pendingMega.delete(`${action.teamIndex}:${action.activeSlot}`);
        actions.push(action);
        if (actions.length < getActiveActors(action.teamIndex).length) {
            renderActionPanel();
        } else if (onlineMode) {
            if (action.teamIndex !== onlineRole) return;
            if (onlineRole === 0) {
                game.currentPlayer = 1;
            } else {
                onlineWaitingForState = true;
            }
            sendOnlineTeamActions(action.teamIndex);
            renderActionPanel();
        } else if (action.teamIndex === 0) {
            game.currentPlayer = 1;
            renderActionPanel();
        } else {
            resolveTurn().catch((error) => {
                console.error("Erro ao resolver o turno:", error);
                game.log.push("Não foi possível concluir o turno. Verifique o registro da batalha.");
                game.pendingActions = [[], []];
                game.pendingTarget = null;
                renderBattle();
            });
        }
    }

    function renderBattle(isResolving = false) {
        battleTurn.textContent = `Turno ${game.turn}`;
        turnControls.hidden = isResolving;
        battlefield.innerHTML = `<div class="battle-arena">
            ${renderFieldEffects()}
            ${renderBattleOrder()}
            <div class="arena-matchup ${game.format === 2 ? "is-doubles" : ""}">
                ${renderBattleTeam(0)}
                ${renderBattleTeam(1)}
            </div>
        </div>`;
        renderBattleLog();
        if (isResolving) {
            positionTurnControls();
            battlefield.querySelectorAll(".arena-side").forEach((side) => side.classList.remove("is-turn"));
            return;
        }
        turnControls.hidden = false;
        renderActionPanel();
    }

    function typeEffectiveness(moveType, defender) {
        let multiplier = 1;
        const effects = defender.moveEffects || {};
        if (moveType === "ground" && effects.telekinesisTurns > 0 && game.fieldEffects.gravityTurns === 0) {
            return 0;
        }
        getMemberTypeNames(defender).forEach((type) => {
            const relations = game.typeDetails.get(type).damage_relations;
            const identifiedImmunity = effects.foresight && type === "ghost"
                && ["normal", "fighting"].includes(moveType)
                || effects.miracleEye && type === "dark" && moveType === "psychic";
            if (relations.no_damage_from.some(({ name }) => name === moveType)
                && !identifiedImmunity
                && !(moveType === "ground" && type === "flying"
                    && (game.fieldEffects.gravityTurns > 0 || effects.grounded))) {
                multiplier = 0;
            }
            else if (relations.double_damage_from.some(({ name }) => name === moveType)) multiplier *= 2;
            else if (relations.half_damage_from.some(({ name }) => name === moveType)) multiplier *= 0.5;
        });
        if (moveType === "fire" && effects.tarShot) multiplier *= 2;
        return multiplier;
    }

    function isGrounded(member) {
        return game.fieldEffects.gravityTurns > 0
            || Boolean(member.moveEffects?.grounded)
            || (!(member.moveEffects?.telekinesisTurns > 0)
                && !getMemberTypeNames(member).includes("flying"));
    }

    function getEffectiveMoveType(move) {
        const { weather, ionDelugeTurn } = game.fieldEffects;
        if (move.name === "weather-ball" && weather.turns > 0) {
            return {
                rain: "water",
                sun: "fire",
                sandstorm: "rock",
                hail: "ice",
                snow: "ice"
            }[weather.name] || move.type.name;
        }
        if (move.type.name === "normal" && ionDelugeTurn === game.turn) return "electric";
        return move.type.name;
    }

    function getMoveDamageMultiplier(attacker, defender, move, moveType, critical) {
        const { weather, terrain, screens } = game.fieldEffects;
        let multiplier = move.name === "weather-ball" && weather.turns > 0 ? 2 : 1;
        if (weather.turns > 0) {
            if (weather.name === "rain") {
                if (moveType === "water") multiplier *= 1.5;
                if (moveType === "fire") multiplier *= 0.5;
            } else if (weather.name === "sun") {
                if (moveType === "fire") multiplier *= 1.5;
                if (moveType === "water") multiplier *= 0.5;
            }
        }
        if (terrain.turns > 0 && isGrounded(attacker)) {
            if (terrain.name === "electric" && moveType === "electric"
                || terrain.name === "grassy" && moveType === "grass"
                || terrain.name === "psychic" && moveType === "psychic") {
                multiplier *= 1.3;
            }
        }
        if (terrain.name === "misty" && terrain.turns > 0 && isGrounded(defender)
            && moveType === "dragon") multiplier *= 0.5;
        if (attacker.moveEffects?.helpingHand) multiplier *= 1.5;
        if (moveType === "electric" && game.fieldEffects.mudSportTurns > 0) multiplier *= 0.5;
        if (moveType === "fire" && game.fieldEffects.waterSportTurns > 0) multiplier *= 0.5;

        const defenseType = move.damage_class.name === "physical" ? "reflect" : "lightScreen";
        const teamScreens = {
            reflect: screens.reflect[defender.teamIndex],
            lightScreen: screens.lightScreen[defender.teamIndex],
            auroraVeil: screens.auroraVeil[defender.teamIndex]
        };
        const screenActive = teamScreens[defenseType] > 0 || teamScreens.auroraVeil > 0;
        if (screenActive && !critical) multiplier *= game.format === 2 ? 2 / 3 : 0.5;
        return multiplier;
    }

    function getBattleStat(member, statName, stageOverride) {
        const statKey = game.fieldEffects.wonderRoomTurns > 0
            ? ({ defense: "special-defense", "special-defense": "defense" }[statName] || statName)
            : statName;
        const base = member.transformedStats?.[statKey] || statValue(member.pokemon, statKey);
        const stage = Math.max(-6, Math.min(6, stageOverride ?? member.statStages[statName] ?? 0));
        const stageMultiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        let value = base * stageMultiplier;
        const types = getMemberTypeNames(member);
        if (statKey === "special-defense" && game.fieldEffects.weather.name === "sandstorm"
            && game.fieldEffects.weather.turns > 0 && types.includes("rock")) value *= 1.5;
        if (statKey === "defense" && game.fieldEffects.weather.name === "snow"
            && game.fieldEffects.weather.turns > 0 && types.includes("ice")) value *= 1.5;
        if (member.status?.name === "burn" && statName === "attack") value *= 0.5;
        if (member.status?.name === "paralysis" && statName === "speed") value *= 0.5;
        if (statName === "speed" && game.fieldEffects.tailwindTurns[member.teamIndex] > 0) value *= 2;
        if (member.heldItem === "assault_vest" && statName === "special-defense"
            || member.heldItem === "eviolite" && member.evioliteEligible
                && ["defense", "special-defense"].includes(statName)) {
            value *= 1.5;
        }
        return Math.max(1, Math.floor(value));
    }

    function getMoveAccuracy(move, attacker, target) {
        if (move.accuracy === null || move.accuracy === undefined) return null;
        let base = move.meta?.category?.name === "ohko"
            ? move.accuracy + BATTLE_LEVEL - BATTLE_LEVEL
            : move.accuracy;
        if (game.fieldEffects.gravityTurns > 0) base *= 5 / 3;
        const stageMultiplier = (stage) => stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);
        const accuracy = stageMultiplier(attacker.statStages.accuracy || 0);
        const evasion = stageMultiplier(target.statStages.evasion || 0);
        return Math.max(1, Math.min(100, base * accuracy / evasion));
    }

    function calculateDamage(attacker, defender, move, effectiveness, moveType) {
        if (!getMovePower(move, attacker) || move.damage_class.name === "status" || effectiveness === 0) {
            return { amount: 0, critical: false };
        }
        const physical = move.damage_class.name === "physical";
        const attackStat = move.name === "foul-play" ? "attack"
            : move.name === "body-press" ? "defense"
                : physical ? "attack" : "special-attack";
        const defenseStat = physical || ["psyshock", "psystrike", "secret-sword"].includes(move.name)
            ? "defense" : "special-defense";
        const criticalStage = Math.min(3, (attacker.criticalStage || 0) + (move.meta?.crit_rate || 0));
        const criticalRates = [1 / 24, 1 / 8, 1 / 2, 1];
        const critical = game.fieldEffects.luckyChantTurns[defender.teamIndex] <= 0
            && Math.random() < criticalRates[criticalStage];
        const attackMember = move.name === "foul-play" ? defender : attacker;
        const attackStage = attackMember.statStages[attackStat] || 0;
        const defenseStage = defender.statStages[defenseStat] || 0;
        const attack = getBattleStat(
            attackMember, attackStat, critical && attackStage < 0 ? 0 : undefined
        );
        const defense = getBattleStat(defender, defenseStat, critical && defenseStage > 0 ? 0 : undefined);
        const power = getMovePower(move, attacker, defender);
        const base = Math.floor((((2 * BATTLE_LEVEL / 5 + 2) * power * attack / defense) / 50) + 2);
        const stab = getMemberTypeNames(attacker).includes(moveType) ? 1.5 : 1;
        const fieldMultiplier = getMoveDamageMultiplier(attacker, defender, move, moveType, critical);
        const itemMultiplier = getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness);
        const criticalMultiplier = critical ? 1.5 : 1;
        return {
            amount: Math.max(1, Math.floor(base * stab * effectiveness * fieldMultiplier * criticalMultiplier
                * itemMultiplier * (0.85 + Math.random() * 0.15))),
            critical
        };
    }

    function getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness) {
        let multiplier = 1;
        if (attacker.heldItem === "life_orb") multiplier *= 1.3;
        if (attacker.heldItem === "expert_belt" && effectiveness > 1) multiplier *= 1.2;
        if (attacker.heldItem === "muscle_band" && move.damage_class.name === "physical") multiplier *= 1.1;
        if (attacker.heldItem === "wise_glasses" && move.damage_class.name === "special") multiplier *= 1.1;
        const typeItems = {
            charcoal: "fire", mystic_water: "water", miracle_seed: "grass", magnet: "electric",
            never_melt_ice: "ice", black_belt: "fighting", poison_barb: "poison", soft_sand: "ground",
            sharp_beak: "flying", twisted_spoon: "psychic", silver_powder: "bug", hard_stone: "rock",
            spell_tag: "ghost", dragon_fang: "dragon", black_glasses: "dark", metal_coat: "steel",
            pixie_plate: "fairy"
        };
        if (typeItems[attacker.heldItem] === moveType) multiplier *= 1.2;
        return multiplier;
    }

    function getMovePower(move, attacker, defender) {
        if (move.name === "spit-up") return 100 * (attacker.moveEffects?.stockpileCount || 0);
        if (move.name === "stored-power" || move.name === "power-trip") {
            const boosts = Object.values(attacker.statStages).reduce((sum, stage) =>
                sum + Math.max(0, stage), 0);
            return 20 + boosts * 20;
        }
        if (move.name === "punishment") {
            const boosts = Object.values(defender?.statStages || {}).reduce((sum, stage) =>
                sum + Math.max(0, stage), 0);
            return Math.min(200, 60 + boosts * 20);
        }
        return move.power || 0;
    }

    function getMoveEffectText(move) {
        const effects = move.effect_entries || [];
        const entry = effects.find(({ language }) => language.name === "en") || effects[0];
        return `${entry?.short_effect || ""} ${entry?.effect || ""}`.toLowerCase();
    }

    function userSwitchesAfterMove(move) {
        return SWITCHING_MOVES.has(move.name)
            || /user (?:must |immediately )?switch(?:es)? out|makes the user switch out|(?:allows|lets) (?:the )?trainer to switch out the user/i
                .test(getMoveEffectText(move));
    }

    function targetIsForcedOut(move) {
        return move.meta?.category?.name === "force-switch"
            || /forces (?:trainers|the target|the opponent) to switch|forces.{0,80}switch out/i
                .test(getMoveEffectText(move));
    }

    function applyFieldMove(action, move) {
        const { fieldEffects } = game;
        const teamIndex = action.teamIndex;
        const attackerName = plainName(game.teams[teamIndex].members[action.attackerIndex].entry.name);
        const weatherMoves = {
            "rain-dance": "rain",
            "sunny-day": "sun",
            sandstorm: "sandstorm",
            hail: "hail",
            snowscape: "snow",
            "chilly-reception": "snow"
        };
        const terrainMoves = {
            "electric-terrain": "electric",
            "grassy-terrain": "grassy",
            "misty-terrain": "misty",
            "psychic-terrain": "psychic"
        };

        if (name === "stockpile") {
            const count = effects.stockpileCount || 0;
            if (count >= 3) return false;
            effects.stockpileCount = count + 1;
            const boosts = effects.stockpileDefenseBoosts || (effects.stockpileDefenseBoosts = {});
            ["defense", "special-defense"].forEach((stat) => {
                const current = member.statStages[stat] || 0;
                const next = Math.min(6, current + 1);
                member.statStages[stat] = next;
                const boostKey = stat === "defense" ? "defense" : "specialDefense";
                boosts[boostKey] = (boosts[boostKey] || 0) + next - current;
            });
            game.log.push(`${memberName} acumulou energia com Stockpile (${effects.stockpileCount}/3).`);
            return true;
        }
        if (name === "swallow") {
            const count = effects.stockpileCount || 0;
            if (!count || effects.healBlockTurns > 0) return false;
            const fractions = [0, 0.25, 0.5, 1];
            const healed = healMember(member, member.maxHp * fractions[count]);
            if (!healed) return false;
            releaseStockpile(member);
            game.log.push(`${memberName} recuperou ${healed} HP com Swallow e liberou Stockpile.`);
            return true;
        }
        if (move.name === "trick-room") {
            fieldEffects.trickRoomTurns = fieldEffects.trickRoomTurns > 0 ? 0 : 5;
            game.log.push(fieldEffects.trickRoomTurns
                ? `${attackerName} distorceu a ordem dos ataques com Trick Room.`
                : `${attackerName} encerrou o efeito de Trick Room.`);
        } else if (move.name === "tailwind") {
            fieldEffects.tailwindTurns[teamIndex] = 4;
            game.log.push(`${attackerName} criou Tailwind; a velocidade do time aumentará por quatro turnos.`);
        } else if (weatherMoves[move.name]) {
            const weather = weatherMoves[move.name];
            fieldEffects.weather = { name: weather, turns: 5 };
            const labels = { rain: "chuva", sun: "sol", sandstorm: "tempestade de areia", hail: "granizo", snow: "neve" };
            game.log.push(`${attackerName} mudou o clima para ${labels[weather]}.`);
        } else if (terrainMoves[move.name]) {
            const terrain = terrainMoves[move.name];
            fieldEffects.terrain = { name: terrain, turns: 5 };
            const labels = { electric: "elétrico", grassy: "gramado", misty: "enevoado", psychic: "psíquico" };
            game.log.push(`${attackerName} criou o campo ${labels[terrain]}.`);
        } else if (["reflect", "light-screen", "aurora-veil"].includes(move.name)) {
            const screen = move.name === "light-screen" ? "lightScreen" : move.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            if (move.name === "aurora-veil" && !["hail", "snow"].includes(fieldEffects.weather.name)) {
                game.log.push(`${attackerName} tentou usar Aurora Veil, mas precisa de granizo ou neve.`);
            } else {
                fieldEffects.screens[teamIndex][screen] = 5;
                game.log.push(`${attackerName} protegeu o time com ${formatName(move.name)}.`);
            }
        } else if (move.name === "safeguard" || move.name === "mist" || move.name === "lucky-chant") {
            const effect = move.name === "safeguard"
                ? "safeguardTurns"
                : move.name === "mist" ? "mistTurns" : "luckyChantTurns";
            fieldEffects[effect][teamIndex] = 5;
            game.log.push(`${attackerName} protegeu o campo do time com ${formatName(move.name)}.`);
        } else if (move.name === "stealth-rock") {
            fieldEffects.hazards[1 - teamIndex].stealthRock = true;
            game.log.push(`${attackerName} espalhou pedras pontiagudas no campo adversário.`);
        } else if (move.name === "spikes" || move.name === "toxic-spikes") {
            const hazard = move.name === "spikes" ? "spikes" : "toxicSpikes";
            const limit = move.name === "spikes" ? 3 : 2;
            fieldEffects.hazards[1 - teamIndex][hazard] = Math.min(
                limit, fieldEffects.hazards[1 - teamIndex][hazard] + 1
            );
            game.log.push(`${attackerName} espalhou ${formatName(move.name)} no campo adversário.`);
        } else if (move.name === "sticky-web") {
            fieldEffects.hazards[1 - teamIndex].stickyWeb = true;
            game.log.push(`${attackerName} cobriu o campo adversário com Sticky Web.`);
        } else if (move.name === "haze") {
            game.teams.forEach((team) => team.members.forEach((member) => { member.statStages = {}; }));
            game.log.push(`${attackerName} dissipou todas as alterações de atributos com Haze.`);
        } else if (move.name === "gravity") {
            fieldEffects.gravityTurns = 5;
            game.log.push(`${attackerName} aumentou a gravidade por cinco turnos.`);
        } else if (move.name === "wonder-room") {
            fieldEffects.wonderRoomTurns = 5;
            game.log.push(`${attackerName} distorceu as defesas com Wonder Room.`);
        } else if (move.name === "mud-sport" || move.name === "water-sport") {
            const effect = move.name === "mud-sport" ? "mudSportTurns" : "waterSportTurns";
            fieldEffects[effect] = 5;
            game.log.push(`${attackerName} ativou ${formatName(move.name)} por cinco turnos.`);
        } else if (move.name === "crafty-shield") {
            fieldEffects.craftyShieldTurn[teamIndex] = game.turn;
            game.log.push(`${attackerName} protegeu o time contra golpes de status neste turno.`);
        } else if (move.name === "magic-room") {
            fieldEffects.magicRoomTurns = 5;
            game.log.push(`${attackerName} suprimiu os efeitos de itens por cinco turnos.`);
        } else if (move.name === "ion-deluge") {
            fieldEffects.ionDelugeTurn = game.turn;
            game.log.push(`${attackerName} carregou o campo com energia elétrica.`);
        } else if (move.name === "fairy-lock") {
            fieldEffects.fairyLockTurn = game.turn + 1;
            game.log.push(`${attackerName} impediu trocas durante o próximo turno.`);
        } else if (move.name === "happy-hour") {
            game.log.push(`${attackerName} usou Happy Hour; o prêmio em dinheiro não é usado nesta batalha.`);
        } else if (move.name === "wish") {
            const activeSlot = game.active[teamIndex].indexOf(action.attackerIndex);
            if (activeSlot < 0 || fieldEffects.wishes[teamIndex][activeSlot]) return false;
            const member = game.teams[teamIndex].members[action.attackerIndex];
            fieldEffects.wishes[teamIndex][activeSlot] = {
                amount: Math.floor(member.maxHp / 2),
                appliedTurn: game.turn,
                dueTurn: game.turn + 1
            };
            game.log.push(`${attackerName} fez um desejo que será atendido no próximo turno.`);
        } else if (move.name === "aromatherapy" || move.name === "heal-bell") {
            let cured = false;
            game.teams[teamIndex].members.forEach((member) => {
                if (!member.status && member.confusionTurns <= 0) return;
                member.status = null;
                member.confusionTurns = 0;
                cured = true;
            });
            game.log.push(cured
                ? `${attackerName} curou as condições de status da equipe com ${formatName(move.name)}.`
                : `${attackerName} usou ${formatName(move.name)}, mas a equipe não tinha condições para curar.`);
        } else {
            return false;
        }
        return true;
    }

    function clearHazards(teamIndex) {
        game.fieldEffects.hazards[teamIndex] = {
            stealthRock: false,
            spikes: 0,
            toxicSpikes: 0,
            stickyWeb: false
        };
    }

    function applyFieldUtilityMove(action, move) {
        const { fieldEffects } = game;
        const attackerName = plainName(game.teams[action.teamIndex].members[action.attackerIndex].entry.name);
        if (move.name === "defog") {
            [0, 1].forEach((teamIndex) => {
                clearHazards(teamIndex);
                Object.keys(fieldEffects.screens).forEach((screen) => { fieldEffects.screens[screen][teamIndex] = 0; });
                fieldEffects.safeguardTurns[teamIndex] = 0;
                fieldEffects.mistTurns[teamIndex] = 0;
            });
            const target = getMoveTargets(action)[0];
            if (target) applyStatChanges(target.member, move, action.teamIndex);
            game.log.push(`${attackerName} dissipou as armadilhas e barreiras com Defog.`);
            return true;
        }
        if (move.name === "court-change") {
            ["hazards", "safeguardTurns", "mistTurns", "luckyChantTurns"].forEach((key) => {
                [fieldEffects[key][0], fieldEffects[key][1]] = [fieldEffects[key][1], fieldEffects[key][0]];
            });
            Object.keys(fieldEffects.screens).forEach((screen) => {
                [fieldEffects.screens[screen][0], fieldEffects.screens[screen][1]] =
                    [fieldEffects.screens[screen][1], fieldEffects.screens[screen][0]];
            });
            game.log.push(`${attackerName} trocou os efeitos de campo dos dois lados com Court Change.`);
            return true;
        }
        if (move.name === "tidy-up") {
            [0, 1].forEach(clearHazards);
            game.teams.forEach((team) => team.members.forEach((member) => {
                if (member.moveEffects?.substituteHp) member.moveEffects.substituteHp = 0;
            }));
            applyStatChanges(game.teams[action.teamIndex].members[action.attackerIndex], move, action.teamIndex);
            game.log.push(`${attackerName} limpou o campo com Tidy Up.`);
            return true;
        }
        return false;
    }

    function getMoveTargets(action) {
        const targetName = action.move.target?.name;
        const opponentTeam = 1 - action.teamIndex;
        const getActiveTargets = (teamIndex, excluded = []) => game.active[teamIndex]
            .map((memberIndex, activeSlot) => ({ teamIndex, activeSlot, memberIndex }))
            .filter(({ activeSlot, memberIndex }) => {
                if (excluded.some((target) => target.teamIndex === teamIndex && target.activeSlot === activeSlot)) return false;
                return memberIndex !== null && game.teams[teamIndex].members[memberIndex].currentHp > 0;
            })
            .map((target) => ({ ...target, member: game.teams[teamIndex].members[target.memberIndex] }));
        const selectedTeam = action.targetTeamIndex
            ?? (["user", "user-or-ally", "ally"].includes(targetName) ? action.teamIndex : opponentTeam);
        const selectedSlot = action.targetActiveSlot
            ?? (selectedTeam === action.teamIndex ? action.activeSlot : 0);

        if (targetName === "user") {
            const memberIndex = game.active[action.teamIndex][action.activeSlot];
            return memberIndex === null ? [] : [{
                teamIndex: action.teamIndex,
                activeSlot: action.activeSlot,
                memberIndex,
                member: game.teams[action.teamIndex].members[memberIndex]
            }];
        }
        if (targetName === "all-opponents") return getActiveTargets(opponentTeam);
        if (targetName === "all-other-pokemon") {
            const user = { teamIndex: action.teamIndex, activeSlot: action.activeSlot };
            return [...getActiveTargets(0, [user]), ...getActiveTargets(1, [user])];
        }
        if (targetName === "all-pokemon") return [...getActiveTargets(0), ...getActiveTargets(1)];
        if (targetName === "random-opponent") {
            const targets = getActiveTargets(opponentTeam);
            return targets.length ? [targets[Math.floor(Math.random() * targets.length)]] : [];
        }
        if (targetName === "opponents-field" || targetName === "users-field" || targetName === "entire-field") {
            return [];
        }

        const memberIndex = game.active[selectedTeam][selectedSlot];
        if (memberIndex === null) return [];
        const member = game.teams[selectedTeam].members[memberIndex];
        return member.currentHp > 0
            ? [{ teamIndex: selectedTeam, activeSlot: selectedSlot, memberIndex, member }]
            : [];
    }

    function getFixedDamage(move, attacker, target) {
        if (move.meta?.category?.name === "ohko") return target.currentHp;
        if (move.name === "final-gambit") return attacker.currentHp;
        if (move.name === "endeavor") return Math.max(0, target.currentHp - attacker.currentHp);
        if (move.name === "counter" && attacker.damageTakenThisTurn > 0
            && attacker.lastDamageClassThisTurn === "physical") return attacker.damageTakenThisTurn * 2;
        if (move.name === "mirror-coat" && attacker.damageTakenThisTurn > 0
            && attacker.lastDamageClassThisTurn === "special") return attacker.damageTakenThisTurn * 2;
        if (move.name === "metal-burst" && attacker.damageTakenThisTurn > 0) {
            return Math.floor(attacker.damageTakenThisTurn * 1.5);
        }
        const effect = getMoveEffectText(move);
        if (/damage equal to (?:the )?user.?s level/i.test(effect)) return BATTLE_LEVEL;
        const fixedDamage = effect.match(/inflicts? (\d+) (?:points? of )?damage/i);
        return fixedDamage ? Number(fixedDamage[1]) : null;
    }

    function getHitCount(move) {
        const minimum = move.meta?.min_hits;
        const maximum = move.meta?.max_hits;
        if (!minimum || !maximum || minimum === maximum) return minimum || 1;
        if (minimum === 2 && maximum === 5) {
            const roll = Math.random();
            return roll < 3 / 8 ? 2 : roll < 6 / 8 ? 3 : roll < 7 / 8 ? 4 : 5;
        }
        return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    }

    function recordDamage(teamIndex, memberIndex, amount) {
        const member = game.teams[teamIndex].members[memberIndex];
        const damage = Math.min(member.currentHp, Math.max(0, Math.floor(amount)));
        if (!damage) return 0;
        const effectKey = `${teamIndex}:${memberIndex}`;
        if (!game.visualEffects.damagedBefore.has(effectKey)) {
            game.visualEffects.damagedBefore.set(effectKey, member.currentHp);
        }
        if (!game.visualEffects.hitMembers.has(effectKey)) playSoundEffect("hit");
        game.visualEffects.hitMembers.add(effectKey);
        member.currentHp -= damage;
        return damage;
    }

    function applyEntryHazards(teamIndex, memberIndex) {
        const member = game.teams[teamIndex].members[memberIndex];
        const hazards = game.fieldEffects.hazards[teamIndex];
        if (member.heldItem === "heavy_duty_boots") {
            if (hazards.stealthRock || hazards.spikes || hazards.toxicSpikes || hazards.stickyWeb) {
                recordItemEffect(teamIndex, memberIndex, "defense", "Heavy-Duty Boots · sem dano");
            }
            return;
        }
        if (member.currentHp <= 0) return;
        const types = getMemberTypeNames(member);
        const grounded = isGrounded(member);

        if (hazards.stealthRock) {
            const effectiveness = typeEffectiveness("rock", member);
            const damage = Math.max(1, Math.floor(member.maxHp * effectiveness / 8));
            const dealt = recordDamage(teamIndex, memberIndex, damage);
            game.log.push(`${plainName(member.entry.name)} sofreu ${dealt} de dano ao entrar por Stealth Rock.`);
        }
        if (member.currentHp <= 0) {
            game.log.push(`${plainName(member.entry.name)} foi derrotado pelas armadilhas.`);
            return;
        }
        if (grounded && hazards.spikes > 0) {
            const fractions = [0, 1 / 8, 1 / 6, 1 / 4];
            const damage = Math.max(1, Math.floor(member.maxHp * fractions[hazards.spikes]));
            const dealt = recordDamage(teamIndex, memberIndex, damage);
            game.log.push(`${plainName(member.entry.name)} sofreu ${dealt} de dano ao entrar por Spikes.`);
        }
        if (member.currentHp <= 0) {
            game.log.push(`${plainName(member.entry.name)} foi derrotado pelas armadilhas.`);
            return;
        }
        if (grounded && hazards.toxicSpikes > 0 && types.includes("poison")) {
            hazards.toxicSpikes = 0;
            game.log.push(`${plainName(member.entry.name)} absorveu Toxic Spikes ao entrar.`);
        } else if (grounded && hazards.toxicSpikes > 0 && !types.includes("steel") && !member.status
            && game.fieldEffects.safeguardTurns[teamIndex] === 0
            && !(game.fieldEffects.terrain.name === "misty" && game.fieldEffects.terrain.turns > 0)) {
            const ailment = hazards.toxicSpikes > 1 ? "toxic" : "poison";
            member.status = { name: ailment, turnsRemaining: null, toxicStage: ailment === "toxic" ? 1 : 0 };
            game.log.push(`${plainName(member.entry.name)} ficou ${ailment === "toxic" ? "gravemente envenenado" : "envenenado"} pelas Toxic Spikes.`);
            consumeLumBerry(member);
        }
        if (member.currentHp > 0 && grounded && hazards.stickyWeb) {
            const current = member.statStages.speed || 0;
            const next = Math.max(-6, current - 1);
            member.statStages.speed = next;
            if (next < current) game.log.push(`${plainName(member.entry.name)} teve a Velocidade reduzida por Sticky Web.`);
        }
    }

    function healMember(member, amount) {
        if (member.moveEffects?.healBlockTurns > 0) return 0;
        const healed = Math.min(member.maxHp - member.currentHp, Math.max(0, Math.floor(amount)));
        member.currentHp += healed;
        return healed;
    }

    function recordItemEffect(teamIndex, memberIndex, kind, label, hpBefore = null) {
        if (!game.visualEffects || memberIndex < 0) return;
        const effectKey = `${teamIndex}:${memberIndex}`;
        game.visualEffects.itemEffects.set(effectKey, { kind, label });
        if (kind === "heal") {
            if (!game.visualEffects.healedBefore.has(effectKey)) {
                const currentHp = game.teams[teamIndex].members[memberIndex].currentHp;
                game.visualEffects.healedBefore.set(effectKey, hpBefore ?? currentHp);
            }
            game.visualEffects.healedMembers.add(effectKey);
            playSoundEffect("heal");
        } else {
            playSoundEffect("item");
        }
    }

    function healWithHeldItem(teamIndex, memberIndex, amount, itemName) {
        const member = game.teams[teamIndex].members[memberIndex];
        const hpBefore = member.currentHp;
        const healed = healMember(member, amount);
        if (healed) recordItemEffect(teamIndex, memberIndex, "heal", `+${healed} HP · ${itemName}`, hpBefore);
        return healed;
    }

    function activateProtection(action, move) {
        const attacker = game.teams[action.teamIndex].members[action.attackerIndex];
        const moveName = move.name;
        if (moveName === "mat-block" && attacker.entryTurn !== game.turn) {
            game.log.push(`${plainName(attacker.entry.name)} usou Mat Block, mas só funciona no turno em que entra em campo.`);
            return false;
        }
        const consecutive = attacker.lastProtectionTurn === game.turn - 1;
        if (!consecutive) attacker.protectionChain = 0;
        if (attacker.protectionChain > 0
            && Math.random() >= 1 / (3 ** attacker.protectionChain)) {
            attacker.protectionChain = 0;
            attacker.lastProtectionTurn = null;
            game.log.push(`${plainName(attacker.entry.name)} tentou usar ${formatName(moveName)}, mas a proteção falhou.`);
            return false;
        }

        attacker.protectionChain++;
        attacker.lastProtectionTurn = game.turn;
        if (PERSONAL_PROTECTION_MOVES.has(moveName)) {
            attacker.protectedTurn = game.turn;
        } else if (moveName === "endure") {
            attacker.enduredTurn = game.turn;
        } else if (moveName === "wide-guard") {
            game.fieldEffects.wideGuardTurn[action.teamIndex] = game.turn;
        } else if (moveName === "quick-guard") {
            game.fieldEffects.quickGuardTurn[action.teamIndex] = game.turn;
        } else if (moveName === "mat-block") {
            game.fieldEffects.matBlockTurn[action.teamIndex] = game.turn;
        }
        const messages = {
            protect: "se protegeu contra ataques.",
            detect: "detectou e bloqueou ataques.",
            "max-guard": "se protegeu com Max Guard.",
            endure: "se preparou para resistir a golpes fatais.",
            "wide-guard": "protegeu a equipe contra golpes que atingem vários alvos.",
            "quick-guard": "protegeu a equipe contra golpes prioritários.",
            "mat-block": "ergueu uma barreira para proteger a equipe."
        };
        game.log.push(`${plainName(attacker.entry.name)} ${messages[moveName]}`);
        return true;
    }

    function protectionBlocksMove(action, target) {
        if (target.teamIndex === action.teamIndex || PROTECTION_BYPASS_MOVES.has(action.move.name)) return false;
        if (target.member.protectedTurn === game.turn) return true;
        if (game.fieldEffects.terrain.name === "psychic" && game.fieldEffects.terrain.turns > 0
            && isGrounded(target.member) && action.move.priority > 0) return true;
        if (action.move.priority > 0
            && game.fieldEffects.quickGuardTurn[target.teamIndex] === game.turn) return true;
        const spreadTargets = ["all-opponents", "all-other-pokemon", "all-pokemon"];
        if (spreadTargets.includes(action.move.target?.name)
            && game.fieldEffects.wideGuardTurn[target.teamIndex] === game.turn) return true;
        if (action.move.damage_class.name === "status"
            && game.fieldEffects.craftyShieldTurn[target.teamIndex] === game.turn) return true;
        return action.move.damage_class.name !== "status"
            && game.fieldEffects.matBlockTurn[target.teamIndex] === game.turn;
    }

    function applyStatChanges(member, move, sourceTeamIndex) {
        const changes = move.stat_changes || [];
        if (!changes.length) return false;
        if (sourceTeamIndex !== member.teamIndex
            && game.fieldEffects.mistTurns[member.teamIndex] > 0
            && changes.some(({ change }) => change < 0)) {
            game.log.push(`${plainName(member.entry.name)} foi protegido de alterações negativas por Mist.`);
            return false;
        }
        const chance = Number(move.meta?.stat_chance) || Number(move.effect_chance)
            || (move.damage_class.name === "status" ? 100 : 0);
        if (chance < 100 && Math.random() * 100 >= chance) return false;

        const labels = {
            attack: "Ataque",
            defense: "Defesa",
            "special-attack": "Ataque Especial",
            "special-defense": "Defesa Especial",
            speed: "Velocidade",
            accuracy: "Precisão",
            evasion: "Esquiva"
        };
        let changed = false;
        changes.forEach(({ change, stat }) => {
            const name = stat.name;
            const current = member.statStages[name] || 0;
            const next = Math.max(-6, Math.min(6, current + change));
            if (next === current) return;
            member.statStages[name] = next;
            changed = true;
            game.log.push(`${plainName(member.entry.name)} ${change > 0 ? "aumentou" : "reduziu"} ${labels[name] || name} ${Math.abs(next - current)} estágio(s).`);
        });
        return changed;
    }

    function applyStatMoveEffect(attacker, target, move) {
        const stats = ["attack", "defense", "special-attack", "special-defense", "speed", "accuracy", "evasion"];
        if (move.name === "clear-smog") {
            target.statStages = {};
            game.log.push(`${plainName(target.entry.name)} teve as alterações de atributos removidas por Clear Smog.`);
            return true;
        }
        if (move.name === "psych-up") {
            attacker.statStages = { ...target.statStages };
            game.log.push(`${plainName(attacker.entry.name)} copiou as alterações de atributos de ${plainName(target.entry.name)}.`);
            return true;
        }
        if (move.name === "heart-swap") {
            [attacker.statStages, target.statStages] = [target.statStages, attacker.statStages];
            game.log.push(`${plainName(attacker.entry.name)} e ${plainName(target.entry.name)} trocaram os estágios de atributos.`);
            return true;
        }
        if (move.name === "power-swap" || move.name === "guard-swap") {
            const selectedStats = move.name === "power-swap"
                ? ["attack", "special-attack"]
                : ["defense", "special-defense"];
            selectedStats.forEach((stat) => {
                [attacker.statStages[stat], target.statStages[stat]] =
                    [target.statStages[stat] || 0, attacker.statStages[stat] || 0];
            });
            game.log.push(`${plainName(attacker.entry.name)} e ${plainName(target.entry.name)} trocaram ${move.name === "power-swap" ? "Ataque" : "Defesa"}.`);
            return true;
        }
        if (move.name === "acupressure") {
            const available = stats.filter((stat) => (target.statStages[stat] || 0) < 6);
            if (!available.length) return false;
            const stat = available[Math.floor(Math.random() * available.length)];
            target.statStages[stat] = Math.min(6, (target.statStages[stat] || 0) + 2);
            game.log.push(`${plainName(target.entry.name)} aumentou ${formatName(stat)} com Acupressure.`);
            return true;
        }
        return false;
    }

    function moveChangesUserStats(move) {
        return /user(?:'|’)?s.{0,40}(?:attack|defen[cs]e|special|speed|accuracy|evasion|stat)/i
            .test(getMoveEffectText(move));
    }

    function applyAilment(member, move, sourceTeamIndex) {
        const baseAilment = move.meta?.ailment?.name;
        const effectText = getMoveEffectText(move);
        const ailment = baseAilment === "poison" && /badly poisons/.test(effectText)
            ? "toxic"
            : baseAilment;
        if (!ailment || ailment === "none") return false;
        const supported = ["burn", "paralysis", "poison", "toxic", "sleep", "freeze", "confusion"];
        if (!supported.includes(ailment)) {
            game.log.push(`O efeito ${ailment} de ${formatName(move.name)} ainda não é simulado.`);
            return false;
        }
        const chance = Number(move.meta?.ailment_chance) || Number(move.effect_chance)
            || (move.damage_class.name === "status" ? 100 : 0);
        if (chance < 100 && Math.random() * 100 >= chance) return false;
        const terrain = game.fieldEffects.terrain;
        if (sourceTeamIndex !== member.teamIndex
            && (game.fieldEffects.safeguardTurns[member.teamIndex] > 0
                || terrain.turns > 0 && terrain.name === "misty" && isGrounded(member)
                || terrain.turns > 0 && terrain.name === "electric" && ailment === "sleep" && isGrounded(member))) {
            game.log.push(`${plainName(member.entry.name)} foi protegido contra ${getAilmentLabel(ailment)}.`);
            return false;
        }
        const types = getMemberTypeNames(member);
        const immuneTypes = {
            burn: ["fire"],
            paralysis: ["electric"],
            poison: ["poison", "steel"],
            toxic: ["poison", "steel"],
            freeze: ["ice"]
        }[ailment] || [];
        if (immuneTypes.some((type) => types.includes(type))) {
            game.log.push(`${plainName(member.entry.name)} é imune a ${getAilmentLabel(ailment)}.`);
            return false;
        }
        if (ailment === "confusion") {
            if (member.confusionTurns > 0) return false;
            const minimum = move.meta?.min_turns || 2;
            const maximum = move.meta?.max_turns || 5;
            member.confusionTurns = minimum + Math.floor(Math.random() * (maximum - minimum + 1));
            game.log.push(`${plainName(member.entry.name)} ficou confuso.`);
            return true;
        }
        if (member.status) return false;
        const minimum = move.meta?.min_turns || 2;
        const maximum = move.meta?.max_turns || 4;
        const turnsRemaining = ailment === "sleep"
            ? minimum + Math.floor(Math.random() * (maximum - minimum + 1)) + 1
            : null;
        member.status = { name: ailment, turnsRemaining, toxicStage: ailment === "toxic" ? 1 : 0 };
        game.log.push(`${plainName(member.entry.name)} ficou ${{
            burn: "queimado",
            paralysis: "paralisado",
            poison: "envenenado",
            toxic: "gravemente envenenado",
            sleep: "dormindo",
            freeze: "congelado"
        }[ailment]}.`);
        consumeLumBerry(member);
        return true;
    }

    function consumeLumBerry(member) {
        if (member.heldItem !== "lum_berry" || !member.status) return false;
        member.status = null;
        member.heldItem = null;
        game.log.push(`${plainName(member.entry.name)} consumiu Lum Berry e curou sua condição de status.`);
        const teamIndex = member.teamIndex;
        const memberIndex = game.teams[teamIndex].members.indexOf(member);
        recordItemEffect(teamIndex, memberIndex, "cure", "Lum Berry · status curado");
        return true;
    }

    function moveRestriction(member, move) {
        const effects = member.moveEffects || {};
        if (member.heldItem === "assault_vest" && move.damage_class.name === "status") {
            return "Assault Vest impede golpes de status.";
        }
        if (effects.disabledMove === move.name && effects.disableTurns > 0) return "Golpe bloqueado por Disable.";
        if (effects.encoreTurns > 0 && effects.encoreMove && effects.encoreMove !== move.name) {
            return `Encore obriga a repetir ${formatName(effects.encoreMove)}.`;
        }
        if (effects.tauntTurns > 0 && move.damage_class.name === "status") return "Taunt impede golpes de status.";
        if (effects.torment && effects.lastMove === move.name) return "Torment impede repetir o mesmo golpe.";
        if (effects.throatChopTurns > 0
            && (SOUND_MOVES.has(move.name) || move.flags?.some(({ name }) => name === "sound"))) {
            return "Throat Chop bloqueia golpes sonoros.";
        }
        return "";
    }

    function releaseStockpile(member) {
        const effects = member.moveEffects || {};
        const boosts = effects.stockpileDefenseBoosts || {};
        member.statStages.defense = Math.max(-6, (member.statStages.defense || 0) - (boosts.defense || 0));
        member.statStages["special-defense"] = Math.max(
            -6, (member.statStages["special-defense"] || 0) - (boosts.specialDefense || 0)
        );
        effects.stockpileCount = 0;
        effects.stockpileDefenseBoosts = {};
    }

    function applyMoveCondition(member, move, sourceTeamIndex, sourceMemberIndex) {
        const effects = member.moveEffects || (member.moveEffects = {});
        const name = move.name;
        const source = game.teams[sourceTeamIndex].members[sourceMemberIndex];
        const memberName = plainName(member.entry.name);
        const sourceName = plainName(source.entry.name);
        const turns = (fallback) => {
            const minimum = move.meta?.min_turns || fallback;
            const maximum = move.meta?.max_turns || fallback;
            return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
        };
        const setTimer = (key, appliedKey, duration) => {
            effects[key] = duration;
            effects[appliedKey] = game.turn;
        };

        if (name === "after-you" || name === "quash") {
            const targetAction = game.moveActionOrder?.find((action) =>
                action.teamIndex === member.teamIndex && action.attackerIndex === game.teams[member.teamIndex].members.indexOf(member));
            const targetIndex = game.moveActionOrder?.indexOf(targetAction);
            const currentIndex = (game.currentResolution?.order || 1) - 1;
            if (!targetAction || targetIndex <= currentIndex) return false;
            game.moveActionOrder.splice(targetIndex, 1);
            if (name === "after-you") {
                game.moveActionOrder.splice(currentIndex + 1, 0, targetAction);
                game.log.push(`${sourceName} fez ${memberName} agir logo em seguida com After You.`);
            } else {
                game.moveActionOrder.push(targetAction);
                game.log.push(`${sourceName} adiou a ação de ${memberName} com Quash.`);
            }
            return true;
        }

        if (name === "leech-seed") {
            if (getMemberTypeNames(member).includes("grass") || effects.leechSeed) return false;
            effects.leechSeed = { teamIndex: sourceTeamIndex, memberIndex: sourceMemberIndex };
            game.log.push(`${memberName} foi semeado por Leech Seed.`);
            return true;
        }
        if (BINDING_MOVES.has(name)) {
            if (effects.bindTurns > 0) return false;
            effects.bindTurns = turns(4);
            effects.bindAppliedTurn = game.turn;
            effects.bindSource = { teamIndex: sourceTeamIndex, memberIndex: sourceMemberIndex };
            game.log.push(`${memberName} ficou preso pelo golpe ${formatName(name)}.`);
            return true;
        }
        if (PERMANENT_TRAP_MOVES.has(name)) {
            if (effects.permanentTrap) return false;
            effects.permanentTrap = true;
            if (name === "jaw-lock") source.moveEffects.permanentTrap = true;
            if (name === "octolock") effects.octolock = true;
            game.log.push(`${memberName} não poderá ser trocado por causa de ${formatName(name)}.`);
            return true;
        }
        if (name === "yawn") {
            if (member.status || effects.drowsyTurns > 0
                || game.fieldEffects.safeguardTurns[member.teamIndex] > 0
                || ["electric", "misty"].includes(game.fieldEffects.terrain.name)
                    && game.fieldEffects.terrain.turns > 0 && isGrounded(member)) {
                return false;
            }
            effects.drowsyTurns = 2;
            effects.drowsyAppliedTurn = game.turn;
            effects.drowsySourceTeam = sourceTeamIndex;
            game.log.push(`${memberName} ficou sonolento por causa de Yawn.`);
            return true;
        }
        if (name === "perish-song") {
            if (effects.perishTurns > 0) return false;
            effects.perishTurns = 3;
            effects.perishAppliedTurn = game.turn;
            game.log.push(`${memberName} ouviu Perish Song; restam três turnos.`);
            return true;
        }
        if (name === "nightmare") {
            if (member.status?.name !== "sleep" || effects.nightmare) return false;
            effects.nightmare = true;
            game.log.push(`${memberName} começou a sofrer com Nightmare.`);
            return true;
        }
        if (name === "disable") {
            if (!effects.lastMove || effects.disableTurns > 0) return false;
            effects.disabledMove = effects.lastMove;
            setTimer("disableTurns", "disableAppliedTurn", turns(4));
            game.log.push(`${sourceName} bloqueou ${formatName(effects.disabledMove)} de ${memberName} com Disable.`);
            return true;
        }
        if (name === "encore") {
            if (!effects.lastMove || effects.encoreTurns > 0) return false;
            effects.encoreMove = effects.lastMove;
            setTimer("encoreTurns", "encoreAppliedTurn", turns(3));
            game.log.push(`${memberName} foi forçado a repetir ${formatName(effects.encoreMove)} por Encore.`);
            return true;
        }
        if (name === "taunt") {
            if (effects.tauntTurns > 0) return false;
            setTimer("tauntTurns", "tauntAppliedTurn", turns(3));
            game.log.push(`${memberName} foi provocado por Taunt.`);
            return true;
        }
        if (name === "torment") {
            if (effects.torment) return false;
            effects.torment = true;
            game.log.push(`${memberName} foi afetado por Torment.`);
            return true;
        }
        if (name === "attract") {
            if (effects.infatuated || member.teamIndex === sourceTeamIndex) return false;
            effects.infatuated = true;
            game.log.push(`${memberName} ficou apaixonado por ${sourceName}.`);
            return true;
        }
        if (name === "ingrain" || name === "aqua-ring") {
            const key = name === "ingrain" ? "ingrain" : "aquaRing";
            if (effects[key]) return false;
            effects[key] = true;
            game.log.push(`${sourceName} criou ${name === "ingrain" ? "raízes com Ingrain" : "um anel de água com Aqua Ring"}.`);
            return true;
        }
        if (name === "heal-block") {
            if (effects.healBlockTurns > 0) return false;
            setTimer("healBlockTurns", "healBlockAppliedTurn", turns(5));
            game.log.push(`${memberName} não poderá recuperar HP por alguns turnos devido a Heal Block.`);
            return true;
        }
        if (name === "embargo") {
            if (effects.embargoTurns > 0) return false;
            setTimer("embargoTurns", "embargoAppliedTurn", turns(5));
            game.log.push(`${memberName} foi afetado por Embargo; itens não são usados nesta batalha.`);
            return true;
        }
        if (name === "telekinesis") {
            if (effects.telekinesisTurns > 0 || effects.grounded) return false;
            setTimer("telekinesisTurns", "telekinesisAppliedTurn", 3);
            game.log.push(`${memberName} foi suspenso no ar por Telekinesis.`);
            return true;
        }
        if (name === "smack-down") {
            if (effects.grounded) return false;
            effects.grounded = true;
            effects.telekinesisTurns = 0;
            game.log.push(`${memberName} foi derrubado no chão por Smack Down.`);
            return true;
        }
        if (name === "tar-shot") {
            if (effects.tarShot) return false;
            effects.tarShot = true;
            game.log.push(`${memberName} ficou coberto de alcatrão e vulnerável a golpes de fogo.`);
            return true;
        }
        if (name === "throat-chop") {
            setTimer("throatChopTurns", "throatChopAppliedTurn", 2);
            game.log.push(`${memberName} não poderá usar golpes sonoros por dois turnos.`);
            return true;
        }
        if (name === "foresight" || name === "odor-sleuth") {
            if (effects.foresight) return false;
            effects.foresight = true;
            game.log.push(`${memberName} não poderá mais se esquivar de golpes Normal ou Lutador.`);
            return true;
        }
        if (name === "miracle-eye") {
            if (effects.miracleEye) return false;
            effects.miracleEye = true;
            game.log.push(`${memberName} ficou vulnerável a golpes Psíquicos.`);
            return true;
        }
        if (name === "destiny-bond") {
            effects.destinyBondTurn = game.turn;
            game.log.push(`${sourceName} criou um vínculo de Destiny Bond.`);
            return true;
        }
        if (name === "helping-hand") {
            if (effects.helpingHand) return false;
            effects.helpingHand = true;
            effects.helpingHandTurn = game.turn;
            game.log.push(`${memberName} recebeu o apoio de Helping Hand.`);
            return true;
        }
        if (name === "magic-coat") {
            effects.magicCoatTurn = game.turn;
            game.log.push(`${sourceName} preparou Magic Coat para refletir golpes de status.`);
            return true;
        }
        if (name === "wish") {
            const activeSlot = game.active[sourceTeamIndex].indexOf(sourceMemberIndex);
            if (activeSlot < 0 || game.fieldEffects.wishes[sourceTeamIndex][activeSlot]) return false;
            game.fieldEffects.wishes[sourceTeamIndex][activeSlot] = {
                amount: Math.floor(source.maxHp / 2),
                appliedTurn: game.turn,
                dueTurn: game.turn + 1
            };
            game.log.push(`${sourceName} fez um desejo que será atendido no próximo turno.`);
            return true;
        }
        if (name === "rest") {
            if (effects.healBlockTurns > 0 || member.currentHp === member.maxHp && !member.status) return false;
            member.currentHp = member.maxHp;
            member.status = { name: "sleep", turnsRemaining: 3, toxicStage: 0 };
            game.log.push(`${memberName} recuperou todo o HP e adormeceu com Rest.`);
            consumeLumBerry(member);
            return true;
        }
        if (name === "refresh") {
            if (!["burn", "paralysis", "poison", "toxic"].includes(member.status?.name)) return false;
            member.status = null;
            game.log.push(`${memberName} curou sua condição de status com Refresh.`);
            return true;
        }
        if (name === "psycho-shift") {
            if (!source.status || member.status) return false;
            const types = getMemberTypeNames(member);
            const immuneTypes = {
                burn: ["fire"],
                paralysis: ["electric"],
                poison: ["poison", "steel"],
                toxic: ["poison", "steel"],
                freeze: ["ice"]
            }[source.status.name] || [];
            if (immuneTypes.some((type) => types.includes(type))
                || game.fieldEffects.safeguardTurns[member.teamIndex] > 0
                || ["electric", "misty"].includes(game.fieldEffects.terrain.name)
                    && game.fieldEffects.terrain.turns > 0 && isGrounded(member)) return false;
            member.status = source.status;
            source.status = null;
            game.log.push(`${sourceName} transferiu sua condição de status para ${memberName}.`);
            consumeLumBerry(member);
            return true;
        }
        if (name === "tri-attack") {
            if (member.status || Math.random() >= 0.2) return false;
            const ailment = ["burn", "paralysis", "freeze"][Math.floor(Math.random() * 3)];
            return applyAilment(member, {
                ...move,
                effect_chance: 100,
                meta: { ...move.meta, ailment: { name: ailment }, ailment_chance: 100 }
            }, sourceTeamIndex);
        }
        if (name === "substitute") {
            if (member !== source || member.currentHp <= Math.floor(member.maxHp / 4)) return false;
            effects.substituteHp = Math.floor(member.maxHp / 4);
            recordDamage(sourceTeamIndex, sourceMemberIndex, effects.substituteHp);
            game.log.push(`${sourceName} criou um Substitute que pode absorver ${effects.substituteHp} de dano.`);
            return true;
        }
        if (name === "transform") {
            if (source === member || source.moveEffects.transformed) return false;
            source.transformedStats = Object.fromEntries(
                ["attack", "defense", "special-attack", "special-defense", "speed"]
                    .map((stat) => [stat, statValue(member.pokemon, stat)])
            );
            source.moves = [...member.moves];
            source.statStages = { ...member.statStages };
            setMemberTypeNames(source, getMemberTypeNames(member));
            source.moveEffects.transformed = true;
            game.log.push(`${sourceName} se transformou em ${memberName}.`);
            return true;
        }
        if (name === "mimic" || name === "sketch") {
            const lastMove = effects.lastMove;
            const copiedMove = member.moves.find(({ name: moveName }) => moveName === lastMove);
            const slot = source.moves.findIndex(({ name: moveName }) => moveName === name);
            if (!copiedMove || slot < 0 || lastMove === "mimic" || lastMove === "sketch") return false;
            source.moves[slot] = copiedMove;
            if (name === "sketch") source.originalMoves[slot] = copiedMove;
            game.log.push(`${sourceName} copiou ${formatName(lastMove)} com ${formatName(name)}.`);
            return true;
        }
        if (name === "aromatherapy" || name === "heal-bell") {
            const team = game.teams[sourceTeamIndex];
            let cured = false;
            team.members.forEach((ally) => {
                if (ally.status || ally.confusionTurns > 0) {
                    ally.status = null;
                    ally.confusionTurns = 0;
                    cured = true;
                }
            });
            if (cured) game.log.push(`${sourceName} curou as condições de status da equipe com ${formatName(name)}.`);
            return cured;
        }
        return false;
    }

    function applyTypeMoveEffect(attacker, target, move) {
        const targetTypes = getMemberTypeNames(target);
        const attackerTypes = getMemberTypeNames(attacker);
        const changesAttacker = [
            "reflect-type", "conversion", "conversion-2", "camouflage", "roost"
        ].includes(move.name);
        let nextTypes = null;
        if (move.name === "soak") nextTypes = ["water"];
        if (move.name === "magic-powder") nextTypes = ["psychic"];
        if (move.name === "forest's-curse" && !targetTypes.includes("grass")) {
            nextTypes = [...targetTypes, "grass"];
        }
        if (move.name === "trick-or-treat" && !targetTypes.includes("ghost")) {
            nextTypes = [...targetTypes, "ghost"];
        }
        if (move.name === "reflect-type" && targetTypes.length) {
            nextTypes = targetTypes;
        }
        if (move.name === "conversion") {
            const firstMoveType = attacker.moves.find(({ type }) => type?.name)?.type?.name;
            if (firstMoveType && !attackerTypes.includes(firstMoveType)) nextTypes = [firstMoveType];
        }
        if (move.name === "conversion-2") {
            const previousType = attacker.moveEffects?.previousMoveType;
            const resistantTypes = previousType
                ? ALL_TYPE_NAMES.filter((type) => {
                    const relations = game.typeDetails.get(type).damage_relations;
                    return relations.half_damage_from.some(({ name }) => name === previousType)
                        || relations.no_damage_from.some(({ name }) => name === previousType);
                }).filter((type) => !attackerTypes.includes(type))
                : [];
            if (resistantTypes.length) {
                nextTypes = [resistantTypes[Math.floor(Math.random() * resistantTypes.length)]];
            }
        }
        if (move.name === "camouflage") {
            nextTypes = [{
                electric: "electric",
                grassy: "grass",
                misty: "fairy",
                psychic: "psychic"
            }[game.fieldEffects.terrain.name] || "normal"];
        }
        if (move.name === "roost") {
            if (attackerTypes.includes("flying")) {
                attacker.moveEffects.roostOriginalTypes = [...attackerTypes];
                attacker.moveEffects.roostRestoreTurn = game.turn;
                nextTypes = attackerTypes.filter((type) => type !== "flying");
            }
        }
        if (nextTypes) {
            const recipient = changesAttacker ? attacker : target;
            const currentTypes = changesAttacker ? attackerTypes : targetTypes;
            if (nextTypes.length === currentTypes.length
                && nextTypes.every((type, index) => type === currentTypes[index])) return false;
            setMemberTypeNames(recipient, nextTypes);
            game.log.push(`${plainName(recipient.entry.name)} agora tem tipagem ${nextTypes.length
                ? nextTypes.map(typeLabel).join(" / ")
                : "neutra"}.`);
            return true;
        }
        return false;
    }

    function canMemberAct(member, teamIndex, memberIndex) {
        const effects = member.moveEffects || {};
        if (effects.infatuated && Math.random() < 0.5) {
            game.log.push(`${plainName(member.entry.name)} está apaixonado e não conseguiu atacar.`);
            return false;
        }
        if (member.flinchedTurn === game.turn) {
            game.log.push(`${plainName(member.entry.name)} recuou e não conseguiu atacar.`);
            return false;
        }
        if (member.status?.name === "sleep") {
            member.status.turnsRemaining--;
            if (member.status.turnsRemaining <= 0) {
                member.status = null;
                game.log.push(`${plainName(member.entry.name)} acordou.`);
            } else {
                game.log.push(`${plainName(member.entry.name)} está dormindo e não atacou.`);
                return false;
            }
        }
        if (member.status?.name === "freeze") {
            if (Math.random() < 0.2) {
                member.status = null;
                game.log.push(`${plainName(member.entry.name)} descongelou.`);
            } else {
                game.log.push(`${plainName(member.entry.name)} está congelado e não atacou.`);
                return false;
            }
        }
        if (member.status?.name === "paralysis" && Math.random() < 0.25) {
            game.log.push(`${plainName(member.entry.name)} está paralisado e não conseguiu atacar.`);
            return false;
        }
        if (member.confusionTurns > 0) {
            member.confusionTurns--;
            if (Math.random() < 1 / 3) {
                const damage = Math.max(1, Math.floor(member.maxHp / 8));
                recordDamage(teamIndex, memberIndex, damage);
                game.log.push(`${plainName(member.entry.name)} se machucou na confusão.`);
                return false;
            }
            if (member.confusionTurns === 0) game.log.push(`${plainName(member.entry.name)} saiu da confusão.`);
        }
        return true;
    }

    function getAilmentLabel(status) {
        return {
            burn: "queimadura",
            poison: "envenenamento",
            toxic: "envenenamento",
            paralysis: "paralisia",
            sleep: "sono",
            freeze: "congelamento",
            confusion: "confusão"
        }[status] || status;
    }

    function applyEndTurnStatusDamage() {
        [0, 1].forEach((teamIndex) => {
            const seen = new Set();
            game.active[teamIndex].forEach((memberIndex) => {
                if (memberIndex === null || seen.has(memberIndex)) return;
                seen.add(memberIndex);
                const member = game.teams[teamIndex].members[memberIndex];
                if (member.currentHp <= 0) return;
                if (["burn", "poison", "toxic"].includes(member.status?.name)) {
                    const damage = member.status.name === "toxic"
                        ? Math.max(1, Math.floor(member.maxHp * member.status.toxicStage / 16))
                        : Math.max(1, Math.floor(member.maxHp / 8));
                    recordDamage(teamIndex, memberIndex, damage);
                    game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano por ${getAilmentLabel(member.status.name)}.`);
                    if (member.status.name === "toxic") member.status.toxicStage = Math.min(15, member.status.toxicStage + 1);
                }
                if (member.currentHp <= 0) return;
                const types = getMemberTypeNames(member);
                const weather = game.fieldEffects.weather.name;
                if (weather === "sandstorm" && !types.some((type) => ["rock", "ground", "steel"].includes(type))
                    || weather === "hail" && !types.includes("ice")) {
                    const damage = Math.max(1, Math.floor(member.maxHp / 16));
                    recordDamage(teamIndex, memberIndex, damage);
                    game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano pelo clima.`);
                }
                if (member.currentHp > 0 && game.fieldEffects.terrain.name === "grassy"
                    && game.fieldEffects.terrain.turns > 0 && isGrounded(member)) {
                    const healed = healMember(member, member.maxHp / 16);
                    if (healed) game.log.push(`${plainName(member.entry.name)} recuperou ${healed} HP pelo campo gramado.`);
                }
                const effects = member.moveEffects || {};
                if (member.currentHp > 0 && effects.bindTurns > 0) {
                    const damage = Math.max(1, Math.floor(member.maxHp / 8));
                    recordDamage(teamIndex, memberIndex, damage);
                    game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano enquanto estava preso.`);
                }
                if (member.currentHp > 0 && effects.octolock) {
                    member.statStages.defense = Math.max(-6, (member.statStages.defense || 0) - 1);
                    member.statStages["special-defense"] =
                        Math.max(-6, (member.statStages["special-defense"] || 0) - 1);
                    game.log.push(`${plainName(member.entry.name)} teve a Defesa e a Defesa Especial reduzidas por Octolock.`);
                }
                if (member.currentHp > 0 && effects.leechSeed) {
                    const damage = Math.max(1, Math.floor(member.maxHp / 8));
                    const dealt = recordDamage(teamIndex, memberIndex, damage);
                    const source = game.teams[effects.leechSeed.teamIndex].members[effects.leechSeed.memberIndex];
                    const healed = healMember(source, dealt);
                    game.log.push(`${plainName(member.entry.name)} perdeu ${dealt} HP por Leech Seed${healed ? `; ${plainName(source.entry.name)} recuperou ${healed} HP` : ""}.`);
                }
                if (member.currentHp > 0 && effects.nightmare && member.status?.name === "sleep") {
                    const damage = Math.max(1, Math.floor(member.maxHp / 4));
                    recordDamage(teamIndex, memberIndex, damage);
                    game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano por Nightmare.`);
                }
                if (member.status?.name !== "sleep") effects.nightmare = false;
                if (member.currentHp > 0 && (effects.ingrain || effects.aquaRing)) {
                    const healed = healMember(member, member.maxHp / 16);
                    if (healed) game.log.push(`${plainName(member.entry.name)} recuperou ${healed} HP.`);
                }
                if (effects.perishTurns > 0) {
                    effects.perishTurns--;
                    game.log.push(`${plainName(member.entry.name)} tem ${effects.perishTurns} turno(s) restantes de Perish Song.`);
                    if (effects.perishTurns === 0) {
                        const damage = recordDamage(teamIndex, memberIndex, member.currentHp);
                        if (damage) game.log.push(`${plainName(member.entry.name)} desmaiou por Perish Song.`);
                    }
                }
                if (effects.drowsyTurns > 0) {
                    effects.drowsyTurns--;
                    if (effects.drowsyTurns === 0 && member.currentHp > 0) {
                        const sourceTeamIndex = effects.drowsySourceTeam ?? teamIndex;
                        applyAilment(member, {
                            damage_class: { name: "status" },
                            effect_chance: 100,
                            meta: {
                                ailment: { name: "sleep" },
                                ailment_chance: 100,
                                min_turns: 2,
                                max_turns: 4
                            }
                        }, sourceTeamIndex ?? teamIndex);
                    }
                }
                [
                    ["bindTurns", "bindAppliedTurn"],
                    ["disableTurns", "disableAppliedTurn"],
                    ["encoreTurns", "encoreAppliedTurn"],
                    ["tauntTurns", "tauntAppliedTurn"],
                    ["healBlockTurns", "healBlockAppliedTurn"],
                    ["embargoTurns", "embargoAppliedTurn"],
                    ["telekinesisTurns", "telekinesisAppliedTurn"],
                    ["throatChopTurns", "throatChopAppliedTurn"]
                ].forEach(([timer, appliedTurn]) => {
                    if (effects[timer] > 0) effects[timer]--;
                    if (effects[timer] === 0) delete effects[appliedTurn];
                });
                applyHeldItemEndTurn(teamIndex, memberIndex);
            });
        });
        game.fieldEffects.wishes.forEach((teamWishes, teamIndex) => {
            teamWishes.forEach((wish, activeSlot) => {
                if (!wish || wish.dueTurn > game.turn) return;
                teamWishes[activeSlot] = null;
                const memberIndex = game.active[teamIndex][activeSlot];
                const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
                const healed = member && member.currentHp > 0 ? healMember(member, wish.amount) : 0;
                game.log.push(healed
                    ? `Wish recuperou ${healed} HP de ${plainName(member.entry.name)}.`
                    : `Wish de ${teamDisplayName(teamIndex)} não recuperou HP.`);
            });
        });
        game.teams.forEach((team) => team.members.forEach((member) => {
            if (member.moveEffects?.destinyBondTurn <= game.turn) member.moveEffects.destinyBondTurn = null;
            if (member.moveEffects?.helpingHandTurn <= game.turn) {
                delete member.moveEffects.helpingHand;
                delete member.moveEffects.helpingHandTurn;
            }
            if (member.moveEffects?.roostRestoreTurn <= game.turn) {
                setMemberTypeNames(member, member.moveEffects.roostOriginalTypes);
                delete member.moveEffects.roostRestoreTurn;
                delete member.moveEffects.roostOriginalTypes;
            }
        }));
    }

    function applyHeldItemEndTurn(teamIndex, memberIndex) {
        const member = game.teams[teamIndex].members[memberIndex];
        if (member.currentHp <= 0 || !member.heldItem) return;
        const name = plainName(member.entry.name);
        if (member.heldItem === "flame_orb" && !member.status
            && !getMemberTypeNames(member).includes("fire")) {
            member.status = { name: "burn", turnsRemaining: 0, toxicStage: 0 };
            game.log.push(`${name} foi queimado pelo Flame Orb.`);
            recordItemEffect(teamIndex, memberIndex, "status", "Flame Orb · queimado");
        } else if (member.heldItem === "toxic_orb" && !member.status
            && !getMemberTypeNames(member).some((type) => ["poison", "steel"].includes(type))) {
            member.status = { name: "toxic", turnsRemaining: 0, toxicStage: 1 };
            game.log.push(`${name} foi gravemente envenenado pelo Toxic Orb.`);
            recordItemEffect(teamIndex, memberIndex, "status", "Toxic Orb · envenenado");
        }

        consumeLumBerry(member);
        if (member.currentHp <= 0) return;
        if (member.currentHp <= member.maxHp / 2
            && ["sitrus_berry", "oran_berry"].includes(member.heldItem)) {
            const amount = member.heldItem === "sitrus_berry" ? member.maxHp / 4 : 10;
            const berry = member.heldItem === "sitrus_berry" ? "Sitrus Berry" : "Oran Berry";
            const healed = healWithHeldItem(teamIndex, memberIndex, amount, berry);
            member.heldItem = null;
            if (healed) game.log.push(`${name} consumiu ${berry} e recuperou ${healed} HP.`);
        }
        if (member.currentHp > 0 && member.heldItem === "leftovers") {
            const healed = healWithHeldItem(teamIndex, memberIndex, member.maxHp / 16, "Leftovers");
            if (healed) game.log.push(`${name} recuperou ${healed} HP com Leftovers.`);
        }
        if (member.currentHp > 0 && member.heldItem === "black_sludge") {
            if (getMemberTypeNames(member).includes("poison")) {
                const healed = healWithHeldItem(teamIndex, memberIndex, member.maxHp / 16, "Black Sludge");
                if (healed) game.log.push(`${name} recuperou ${healed} HP com Black Sludge.`);
            } else {
                const damage = Math.max(1, Math.floor(member.maxHp / 8));
                recordDamage(teamIndex, memberIndex, damage);
                game.log.push(`${name} sofreu ${damage} de dano por Black Sludge.`);
                recordItemEffect(teamIndex, memberIndex, "damage", `Black Sludge · -${damage} HP`);
            }
        }
    }

    function decrementFieldEffects() {
        const { fieldEffects } = game;
        if (fieldEffects.trickRoomTurns > 0) {
            fieldEffects.trickRoomTurns--;
            if (fieldEffects.trickRoomTurns === 0) game.log.push("O efeito de Trick Room acabou.");
        }
        fieldEffects.tailwindTurns = fieldEffects.tailwindTurns.map((turns, teamIndex) => {
            if (turns <= 0) return 0;
            const remaining = turns - 1;
            if (remaining === 0) game.log.push(`O Tailwind de ${teamDisplayName(teamIndex)} acabou.`);
            return remaining;
        });

        ["weather", "terrain"].forEach((key) => {
            const effect = fieldEffects[key];
            if (effect.turns <= 0) return;
            effect.turns--;
            if (effect.turns === 0) {
                game.log.push(`O efeito de ${key === "weather" ? "clima" : "terreno"} acabou.`);
                effect.name = null;
            }
        });
        ["reflect", "lightScreen", "auroraVeil"].forEach((screen) => {
            fieldEffects.screens[screen] = fieldEffects.screens[screen].map((turns) => Math.max(0, turns - 1));
        });
        ["safeguardTurns", "mistTurns", "luckyChantTurns"].forEach((key) => {
            fieldEffects[key] = fieldEffects[key].map((turns) => Math.max(0, turns - 1));
        });
        ["gravityTurns", "wonderRoomTurns", "magicRoomTurns", "mudSportTurns", "waterSportTurns"].forEach((key) => {
            fieldEffects[key] = Math.max(0, fieldEffects[key] - 1);
        });
        if (fieldEffects.fairyLockTurn === game.turn) fieldEffects.fairyLockTurn = null;
        if (fieldEffects.ionDelugeTurn === game.turn) fieldEffects.ionDelugeTurn = null;
    }

    async function forceSwitchTarget(target, moveName) {
        const reserves = getAvailableSwitches(target.teamIndex);
        if (!reserves.length) {
            game.log.push(`${plainName(target.member.entry.name)} não tinha reserva para ser trocado por ${formatName(moveName)}.`);
            return false;
        }
        if (onlineMode && target.teamIndex !== onlineRole) {
            if (!onlineSocket?.connected) {
                setOnlineLobbyStatus("A conexão com a sala foi perdida.", true);
                return false;
            }
            return new Promise((resolve) => {
                pendingForcedSwitchResolution = resolve;
                onlineSocket.emit("battle:forced-switch-request", {
                    roomCode: onlineRoomCode,
                    teamIndex: target.teamIndex,
                    activeSlot: target.activeSlot,
                    moveName
                }, (response) => {
                    if (response?.ok) return;
                    pendingForcedSwitchResolution = null;
                    resolve(false);
                    setOnlineLobbyStatus(response?.error || "Não foi possível solicitar a troca.", true);
                });
            });
        }
        await new Promise((resolve) => openSwitchPicker(
            target.teamIndex, target.activeSlot, true, moveName, resolve
        ));
        return true;
    }

    async function showMoveImpact() {
        if (!game.currentResolution || game.currentResolution.impactShown) return;
        game.currentResolution.phase = "impact";
        game.visualEffects.attackers.clear();
        renderBattle(true);
        sendOnlineVisualState();
        const hasItemEffect = game.visualEffects.itemEffects.size || game.visualEffects.healedMembers.size;
        await waitForAnimation(game.visualEffects.hitMembers.size || hasItemEffect ? 850 : 500);
        game.currentResolution.impactShown = true;
    }

    async function resolveMoveAction(action) {
        const attacker = game.teams[action.teamIndex].members[action.attackerIndex];
        let move = action.move;
        let moveName = plainName(move.name);
        const attackerName = plainName(attacker.entry.name);
        if (attacker.currentHp <= 0) return;
        if (game.active[action.teamIndex][action.activeSlot] !== action.attackerIndex) {
            game.log.push(`${attackerName} foi trocado antes de usar ${moveName}.`);
            return;
        }
        if (!canMemberAct(attacker, action.teamIndex, action.attackerIndex)) return;
        const restriction = moveRestriction(attacker, move);
        if (restriction) {
            game.log.push(`${attackerName} não conseguiu usar ${moveName}. ${restriction}`);
            return;
        }
        attacker.moveEffects = attacker.moveEffects || {};
        if (["copycat", "mirror-move", "metronome"].includes(move.name)) {
            const previous = game.lastExecutedMove;
            const expectedTeam = action.targetTeamIndex;
            const availableMoves = game.teams.flatMap((team) =>
                team.members.flatMap((member) => member.moves))
                .filter((candidate) => ![
                    "copycat", "mirror-move", "metronome", "mimic", "sketch", "struggle"
                ].includes(candidate.name));
            const copiedMove = move.name === "metronome"
                ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
                : previous?.move;
            if (!copiedMove || move.name !== "metronome"
                && (move.name === "mirror-move" && previous.teamIndex !== expectedTeam
                    || ["copycat", "mirror-move", "struggle"].includes(copiedMove.name))) {
                game.log.push(`${attackerName} tentou usar ${moveName}, mas não havia um golpe válido para copiar.`);
                return;
            }
            move = copiedMove;
            action = { ...action, move };
            moveName = plainName(move.name);
        }
        attacker.moveEffects.previousMoveType = attacker.moveEffects.lastMoveType;
        attacker.moveEffects.lastMove = move.name;
        attacker.moveEffects.lastMoveType = move.type?.name || null;
        game.lastExecutedMove = { move, teamIndex: action.teamIndex, attackerIndex: action.attackerIndex };
        if (action.targetUnavailable) {
            game.log.push(`${attackerName} tentou usar ${moveName}, mas não havia um aliado válido para receber o golpe.`);
            return;
        }
        game.visualEffects.attackers.add(`${action.teamIndex}:${action.attackerIndex}`);
        playSoundEffect("attack");
        if (game.currentResolution) {
            game.currentResolution.phase = "attacking";
            renderBattle(true);
            sendOnlineVisualState();
            await waitForAnimation(550);
        }
        if (move.name === "shed-tail" && attacker.currentHp <= Math.floor(attacker.maxHp / 2)) {
            game.log.push(`${attackerName} tentou usar Shed Tail, mas não tinha HP suficiente.`);
            return;
        }
        if (move.name === "burn-up" && !getMemberTypeNames(attacker).includes("fire")
            || move.name === "double-shock" && !getMemberTypeNames(attacker).includes("electric")) {
            game.log.push(`${attackerName} tentou usar ${moveName}, mas não tinha a tipagem necessária.`);
            return;
        }
        if (move.name === "spit-up" && !(attacker.moveEffects.stockpileCount > 0)) {
            game.log.push(`${attackerName} tentou usar Spit Up sem energia acumulada por Stockpile.`);
            return;
        }

        if (PROTECTION_MOVES.has(move.name)) {
            activateProtection(action, move);
            return;
        }
        if (move.name === "focus-energy") {
            attacker.criticalStage = 2;
            game.log.push(`${attackerName} concentrou sua energia para aumentar os acertos críticos.`);
            return;
        }
        if (["defog", "court-change", "tidy-up"].includes(move.name)) {
            applyFieldUtilityMove(action, move);
            return;
        }

        const targets = getMoveTargets(action);
        if (!targets.length) {
            if (!applyFieldMove(action, move)) {
                game.log.push(`${attackerName} usou ${moveName}; efeitos de campo não são simulados.`);
            }
            if (userSwitchesAfterMove(move) && getAvailableSwitches(action.teamIndex).length) {
                await showMoveImpact();
                await new Promise((resolve) => openSwitchPicker(
                    action.teamIndex, action.activeSlot, true, move.name, resolve
                ));
            } else if (userSwitchesAfterMove(move)) {
                game.log.push(`${attackerName} não tinha reserva para entrar após ${moveName}.`);
            }
            return;
        }
        const effectText = getMoveEffectText(move);
        const fixedDamage = getFixedDamage(move, attacker, targets[0].member);
        if (["counter", "mirror-coat", "metal-burst"].includes(move.name) && fixedDamage === null) {
            game.log.push(`${attackerName} usou ${moveName}, mas não sofreu o tipo de dano necessário para revidar.`);
            return;
        }
        const damageMove = move.damage_class.name !== "status"
            && (getMovePower(move, attacker, targets[0].member) > 0 || fixedDamage !== null);
        const changesUserStats = move.name !== "stockpile" && moveChangesUserStats(move);
        let successful = false;
        let userStatsApplied = false;
        let totalDamage = 0;
        let totalHitDamage = 0;

        for (const target of targets) {
            if (target.member.currentHp <= 0) continue;
            if (protectionBlocksMove(action, target)) {
                game.log.push(`${plainName(target.member.entry.name)} bloqueou ${moveName} com proteção.`);
                successful = true;
                continue;
            }
            const accuracy = getMoveAccuracy(move, attacker, target.member);
            if (accuracy && Math.random() * 100 >= accuracy) {
                game.log.push(`${attackerName} usou ${moveName}, mas errou contra ${plainName(target.member.entry.name)}.`);
                continue;
            }
            if (move.damage_class.name === "status"
                && target.teamIndex !== action.teamIndex
                && target.member.moveEffects?.magicCoatTurn === game.turn) {
                let reflected = false;
                if (TYPE_MOVE_NAMES.has(move.name)) {
                    reflected = applyTypeMoveEffect(attacker, target.member, move);
                } else if (STAT_EFFECT_MOVE_NAMES.has(move.name)) {
                    reflected = applyStatMoveEffect(attacker, target.member, move);
                } else if (MOVE_CONDITION_NAMES.has(move.name)) {
                    reflected = applyMoveCondition(attacker, move, target.teamIndex, target.memberIndex);
                } else {
                    reflected = applyAilment(attacker, move, target.teamIndex);
                }
                successful = applyStatChanges(attacker, move, target.teamIndex) || reflected || successful;
                game.log.push(`${plainName(target.member.entry.name)} refletiu ${moveName} com Magic Coat.`);
                continue;
            }
            const moveType = getEffectiveMoveType(move);
            const effectiveness = damageMove ? typeEffectiveness(moveType, target.member) : 1;
            if (damageMove && effectiveness === 0) {
                game.log.push(`${attackerName} usou ${moveName} em ${plainName(target.member.entry.name)}, mas não afetou o alvo.`);
                continue;
            }
            const substitute = target.member.moveEffects?.substituteHp > 0
                && target.teamIndex !== action.teamIndex;
            if (substitute && !damageMove) {
                game.log.push(`${plainName(target.member.entry.name)} foi protegido por Substitute contra ${moveName}.`);
                successful = true;
                continue;
            }

            if (move.name === "pollen-puff" && target.teamIndex === action.teamIndex) {
                const healed = healMember(target.member, target.member.maxHp / 2);
                game.log.push(healed
                    ? `${attackerName} usou ${moveName} e recuperou ${healed} HP de ${plainName(target.member.entry.name)}.`
                    : `${attackerName} usou ${moveName}, mas ${plainName(target.member.entry.name)} já estava com HP cheio.`);
                successful = healed > 0;
                continue;
            }

            if (move.name === "pain-split") {
                const sharedHp = Math.floor((attacker.currentHp + target.member.currentHp) / 2);
                const attackerHp = Math.min(attacker.maxHp, sharedHp);
                const targetHp = Math.min(target.member.maxHp, sharedHp);
                if (attacker.currentHp > attackerHp) {
                    recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp - attackerHp);
                } else {
                    healMember(attacker, attackerHp - attacker.currentHp);
                }
                if (target.member.currentHp > targetHp) {
                    recordDamage(target.teamIndex, target.memberIndex, target.member.currentHp - targetHp);
                } else {
                    healMember(target.member, targetHp - target.member.currentHp);
                }
                game.log.push(`${attackerName} usou Pain Split; ambos ficaram com até ${sharedHp} HP.`);
                successful = true;
                continue;
            }

            if (damageMove) {
                if (move.name === "endeavor" && fixedDamage === 0) {
                    game.log.push(`${attackerName} usou Endeavor, mas o alvo não tinha mais HP que ele.`);
                    continue;
                }
                const hitCount = fixedDamage === null ? getHitCount(move) : 1;
                const hitResults = fixedDamage === null
                    ? Array.from({ length: hitCount }, () => calculateDamage(
                        attacker, target.member, move, effectiveness, moveType
                    ))
                    : [];
                let damage = fixedDamage === null
                    ? hitResults.reduce((sum, hit) => sum + hit.amount, 0)
                    : fixedDamage;
                if (move.meta?.category?.name === "ohko") damage = target.member.currentHp;
                const endured = !substitute
                    && target.member.enduredTurn === game.turn && damage >= target.member.currentHp;
                if (endured) damage = Math.max(0, target.member.currentHp - 1);
                const sashActivated = !substitute && !endured
                    && target.member.heldItem === "focus_sash"
                    && target.member.currentHp === target.member.maxHp
                    && damage >= target.member.currentHp;
                if (sashActivated) {
                    damage = Math.max(0, target.member.currentHp - 1);
                    target.member.heldItem = null;
                    recordItemEffect(target.teamIndex, target.memberIndex, "defense", "Focus Sash · resistiu");
                }
                let dealt = 0;
                let substituteAbsorbed = 0;
                if (substitute) {
                    substituteAbsorbed = Math.min(target.member.moveEffects.substituteHp, damage);
                    target.member.moveEffects.substituteHp -= substituteAbsorbed;
                    game.log.push(`O Substitute de ${plainName(target.member.entry.name)} absorveu ${substituteAbsorbed} de dano${target.member.moveEffects.substituteHp ? ` (${target.member.moveEffects.substituteHp} restantes)` : "; foi destruído"}.`);
                    successful = substituteAbsorbed > 0 || successful;
                } else {
                    dealt = recordDamage(target.teamIndex, target.memberIndex, damage);
                }
                totalHitDamage += dealt + substituteAbsorbed;
                if (dealt > 0) {
                    target.member.damageTakenThisTurn = dealt;
                    target.member.lastDamageClassThisTurn = move.damage_class.name;
                    const itemMultiplier = getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness);
                    if (itemMultiplier > 1) {
                        const itemName = formatName(attacker.heldItem.replace(/_/g, "-"));
                        recordItemEffect(action.teamIndex, action.attackerIndex, "boost", `${itemName} · dano aumentado`);
                    }
                }
                totalDamage += dealt;
                successful = dealt > 0 || successful;
                let message = substitute
                    ? `${attackerName} usou ${moveName} em ${plainName(target.member.entry.name)}, mas o dano foi absorvido pelo Substitute.`
                    : `${attackerName} usou ${moveName} em ${plainName(target.member.entry.name)} e causou ${dealt} de dano.`;
                if (endured) message += ` ${plainName(target.member.entry.name)} resistiu com 1 HP graças a Endure.`;
                if (hitResults.some(({ critical }) => critical)) message += " Acerto crítico!";
                if (hitCount > 1) message += ` Acertou ${hitCount} vezes.`;
                if (sashActivated) message += ` Focus Sash permitiu que ${plainName(target.member.entry.name)} resistisse com 1 HP.`;
                if (effectiveness > 1) message += " Foi super efetivo!";
                else if (effectiveness < 1) message += " Não foi muito efetivo.";
                game.log.push(message);
                if (dealt > 0 && effectiveness > 1 && target.member.heldItem === "weakness_policy") {
                    target.member.statStages.attack = Math.min(6, (target.member.statStages.attack || 0) + 2);
                    target.member.statStages["special-attack"] =
                        Math.min(6, (target.member.statStages["special-attack"] || 0) + 2);
                    target.member.heldItem = null;
                    game.log.push(`${plainName(target.member.entry.name)} ativou Weakness Policy e aumentou Ataque e Ataque Especial.`);
                    recordItemEffect(target.teamIndex, target.memberIndex, "boost", "Weakness Policy · ataque aumentado");
                }
                if (dealt > 0 && move.flags?.some(({ name }) => name === "contact")
                    && target.member.heldItem === "rocky_helmet" && attacker.currentHp > 0) {
                    const recoil = Math.max(1, Math.floor(attacker.maxHp / 6));
                    const helmetDamage = recordDamage(action.teamIndex, action.attackerIndex, recoil);
                    game.log.push(`Rocky Helmet causou ${helmetDamage} de dano a ${attackerName}.`);
                    if (helmetDamage) {
                        recordItemEffect(action.teamIndex, action.attackerIndex, "damage", `Rocky Helmet · -${helmetDamage} HP`);
                    }
                    if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo Rocky Helmet.`);
                }
                if (target.member.currentHp === 0) game.log.push(`${plainName(target.member.entry.name)} foi derrotado.`);
                if (target.member.currentHp === 0
                    && target.member.moveEffects?.destinyBondTurn === game.turn
                    && target.teamIndex !== action.teamIndex && attacker.currentHp > 0) {
                    recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp);
                    game.log.push(`${attackerName} também desmaiou por Destiny Bond.`);
                }
            }

            if (substitute) continue;
            if (changesUserStats
                && target.teamIndex === action.teamIndex
                && target.memberIndex === action.attackerIndex
                && !userStatsApplied) {
                successful = applyStatChanges(attacker, move, action.teamIndex) || successful;
                userStatsApplied = true;
            }
            if (target.member.currentHp > 0) {
                if (move.name === "strength-sap") {
                    const healed = healMember(attacker, getBattleStat(target.member, "attack"));
                    if (healed) {
                        game.log.push(`${attackerName} recuperou ${healed} HP com Strength Sap.`);
                        successful = true;
                    }
                }
                if (STAT_EFFECT_MOVE_NAMES.has(move.name)) {
                    successful = applyStatMoveEffect(attacker, target.member, move) || successful;
                } else if (!changesUserStats && move.name !== "stockpile") {
                    successful = applyStatChanges(target.member, move, action.teamIndex) || successful;
                }
                if (TYPE_MOVE_NAMES.has(move.name)) {
                    successful = applyTypeMoveEffect(attacker, target.member, move) || successful;
                } else if (MOVE_CONDITION_NAMES.has(move.name) || move.meta?.ailment?.name === "trap") {
                    successful = applyMoveCondition(
                        target.member, move, action.teamIndex, action.attackerIndex
                    ) || successful;
                } else {
                    successful = applyAilment(target.member, move, action.teamIndex) || successful;
                }
                const flinchChance = Number(move.meta?.flinch_chance) || 0;
                if (flinchChance && Math.random() * 100 < flinchChance) {
                    target.member.flinchedTurn = game.turn;
                    game.log.push(`${plainName(target.member.entry.name)} recuou.`);
                    successful = true;
                }
                if (move.meta?.healing > 0 && move.name !== "swallow") {
                    const healed = healMember(target.member, target.member.maxHp * move.meta.healing / 100);
                    if (healed) {
                        game.log.push(`${plainName(target.member.entry.name)} recuperou ${healed} HP.`);
                        successful = true;
                    }
                }
                if (targetIsForcedOut(move) && game.teams[target.teamIndex].members[target.memberIndex].currentHp > 0) {
                    await showMoveImpact();
                    successful = await forceSwitchTarget(target, move.name) || successful;
                }
            }
        }

        if (changesUserStats && !userStatsApplied && successful) {
            successful = applyStatChanges(attacker, move, action.teamIndex) || successful;
        }
        if (successful && ["burn-up", "double-shock"].includes(move.name)) {
            const removedType = move.name === "burn-up" ? "fire" : "electric";
            setMemberTypeNames(attacker, getMemberTypeNames(attacker).filter((type) => type !== removedType));
            game.log.push(`${attackerName} perdeu o tipo ${typeLabel(removedType)} após ${moveName}.`);
        }
        if (move.name === "spit-up") releaseStockpile(attacker);
        if (move.name === "rapid-spin" && successful) {
            clearHazards(action.teamIndex);
            attacker.moveEffects.bindTurns = 0;
            game.log.push(`${attackerName} removeu armadilhas e escapou de golpes que o prendiam com Rapid Spin.`);
        }
        if (damageMove && attacker.moveEffects.helpingHand) delete attacker.moveEffects.helpingHand;
        if (userSwitchesAfterMove(move) && move.damage_class.name === "status") successful = true;
        if (move.name === "shed-tail") {
            const cost = Math.floor(attacker.maxHp / 2);
            recordDamage(action.teamIndex, action.attackerIndex, cost);
            game.log.push(`${attackerName} perdeu ${cost} HP ao usar Shed Tail.`);
        }
        if (move.meta?.drain > 0 && totalDamage > 0) {
            const healed = healMember(attacker, totalDamage * move.meta.drain / 100);
            if (healed) game.log.push(`${attackerName} recuperou ${healed} HP com ${moveName}.`);
        } else if (move.meta?.drain < 0 && totalDamage > 0) {
            const recoil = Math.max(1, Math.floor(totalDamage * Math.abs(move.meta.drain) / 100));
            const received = recordDamage(action.teamIndex, action.attackerIndex, recoil);
            game.log.push(`${attackerName} recebeu ${received} de dano de recuo.`);
            if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo recuo.`);
        }
        if (totalHitDamage > 0 && attacker.currentHp > 0 && attacker.heldItem === "shell_bell") {
            const healed = healWithHeldItem(action.teamIndex, action.attackerIndex, totalHitDamage / 8, "Shell Bell");
            if (healed) game.log.push(`${attackerName} recuperou ${healed} HP com Shell Bell.`);
        }
        if (totalHitDamage > 0 && attacker.currentHp > 0 && attacker.heldItem === "life_orb") {
            const recoil = Math.max(1, Math.floor(attacker.maxHp / 10));
            const received = recordDamage(action.teamIndex, action.attackerIndex, recoil);
            game.log.push(`${attackerName} perdeu ${received} HP pelo recuo de Life Orb.`);
            if (received) recordItemEffect(action.teamIndex, action.attackerIndex, "damage", `Life Orb · -${received} HP`);
            if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo recuo de Life Orb.`);
        }

        if (/user faints\b|causes the user to faint|user faints upon/i.test(effectText) && attacker.currentHp > 0) {
            const received = recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp);
            if (received) game.log.push(`${attackerName} desmaiou após usar ${moveName}.`);
        }

        if (userSwitchesAfterMove(move) && successful && attacker.currentHp > 0) {
            if (getAvailableSwitches(action.teamIndex).length) {
                await showMoveImpact();
                await new Promise((resolve) => openSwitchPicker(
                    action.teamIndex, action.activeSlot, true, move.name, resolve
                ));
            } else {
                game.log.push(`${attackerName} não tinha reserva para entrar após ${moveName}.`);
            }
        }

        const hasSupportedEffect = Boolean(move.power || fixedDamage !== null || move.stat_changes?.length
            || (move.meta?.ailment?.name && move.meta.ailment.name !== "none")
            || move.meta?.healing || move.meta?.drain
            || targetIsForcedOut(move) || userSwitchesAfterMove(move)
            || MOVE_CONDITION_NAMES.has(move.name)
            || TYPE_MOVE_NAMES.has(move.name)
            || STAT_EFFECT_MOVE_NAMES.has(move.name)
            || ["aromatherapy", "heal-bell", "defog", "court-change", "tidy-up", "wish", "counter",
                "mirror-coat", "metal-burst", "pain-split", "final-gambit", "endeavor", "spit-up"].includes(move.name));
        if (!successful && move.damage_class.name === "status" && hasSupportedEffect) {
            game.log.push(`${attackerName} usou ${moveName}, mas o efeito falhou.`);
        } else if (!hasSupportedEffect) {
            game.log.push(`${attackerName} usou ${moveName}, mas seu efeito especial não é simulado.`);
        }
    }

    function clearFaintedSlots(teamIndex) {
        const team = game.teams[teamIndex];
        const active = game.active[teamIndex];
        active.forEach((memberIndex, activeSlot) => {
            if (memberIndex === null || team.members[memberIndex].currentHp > 0) return;
            active[activeSlot] = null;
        });
    }

    function megaEvolveMember(teamIndex, memberIndex) {
        const member = game.teams[teamIndex].members[memberIndex];
        if (!member.megaPokemon || !member.heldItem || game.megaUsed[teamIndex]
            || MEGA_STONES[member.heldItem] !== member.megaPokemon.name) return false;
        member.pokemon = member.megaPokemon;
        member.megaEvolved = true;
        member.megaTypes = member.pokemon.types.map(({ type }) => type.name);
        setMemberTypeNames(member, member.megaTypes);
        member.heldItem = null;
        game.megaUsed[teamIndex] = true;
        game.visualEffects.megaEvolved.add(`${teamIndex}:${memberIndex}`);
        game.log.push(`${plainName(member.entry.name)} Mega Evoluiu para ${plainName(member.pokemon.name)}!`);
        return true;
    }

    async function resolveTurn() {
        const actions = game.pendingActions.flat().filter(Boolean);
        game.visualEffects = {
            attackers: new Set(),
            hitMembers: new Set(),
            damagedBefore: new Map(),
            itemEffects: new Map(),
            healedMembers: new Set(),
            healedBefore: new Map(),
            megaEvolved: new Set()
        };
        game.teams.forEach((team) => team.members.forEach((member) => {
            member.damageTakenThisTurn = 0;
            member.lastDamageClassThisTurn = null;
        }));
        actions.filter((action) => action.megaEvolve).forEach((action) => {
            if (game.active[action.teamIndex][action.activeSlot] !== action.attackerIndex
                || !megaEvolveMember(action.teamIndex, action.attackerIndex)) {
                game.log.push(`${plainName(game.teams[action.teamIndex].members[action.attackerIndex].entry.name)} não pôde Mega Evoluir.`);
                action.megaEvolve = false;
            }
        });
        if (game.visualEffects.megaEvolved.size) {
            renderBattle(true);
            sendOnlineVisualState();
            await waitForAnimation(1500);
            game.visualEffects.megaEvolved.clear();
        }
        actions.filter((action) => Number.isInteger(action.switchToIndex)).forEach((action) => {
            if (game.fieldEffects.fairyLockTurn === game.turn) {
                game.log.push("Uma troca foi impedida por Fairy Lock.");
                return;
            }
            const team = game.teams[action.teamIndex];
            const outgoing = team.members[action.attackerIndex];
            const incoming = team.members[action.switchToIndex];
            if (!canVoluntarilySwitch(outgoing)) {
                game.log.push(`${plainName(outgoing.entry.name)} não pode ser trocado agora.`);
                return;
            }
            outgoing.statStages = {};
            outgoing.confusionTurns = 0;
            outgoing.moveEffects = {};
            setMemberTypeNames(outgoing, memberResetTypes(outgoing));
            outgoing.moves = [...outgoing.originalMoves];
            outgoing.transformedStats = null;
            outgoing.protectionChain = 0;
            outgoing.criticalStage = 0;
            game.active[action.teamIndex][action.activeSlot] = action.switchToIndex;
            incoming.entryTurn = game.turn;
            game.log.push(`${teamDisplayName(action.teamIndex)} trocou ${plainName(outgoing.entry.name)} por ${plainName(incoming.entry.name)}.`);
            applyEntryHazards(action.teamIndex, action.switchToIndex);
        });

        const moveActions = actions.filter((action) => !Number.isInteger(action.switchToIndex));
        const speedTieBreakers = new Map(moveActions.map((action) => [action, Math.random()]));
        moveActions.sort((a, b) => {
            const priorityDifference = (b.move.priority || 0) - (a.move.priority || 0);
            if (priorityDifference !== 0) return priorityDifference;
            const attackerA = game.teams[a.teamIndex].members[a.attackerIndex];
            const attackerB = game.teams[b.teamIndex].members[b.attackerIndex];
            const speedDifference = getBattleStat(attackerB, "speed") - getBattleStat(attackerA, "speed");
            if (speedDifference !== 0) {
                return game.fieldEffects.trickRoomTurns > 0 ? -speedDifference : speedDifference;
            }
            return speedTieBreakers.get(a) - speedTieBreakers.get(b);
        });

        const trickRoomActive = game.fieldEffects.trickRoomTurns > 0;
        game.moveActionOrder = moveActions;
        for (let index = 0; index < moveActions.length; index++) {
            const action = moveActions[index];
            const attacker = game.teams[action.teamIndex].members[action.attackerIndex];
            game.currentResolution = {
                teamIndex: action.teamIndex,
                attackerIndex: action.attackerIndex,
                pokemonName: attacker.entry.name,
                moveName: action.move.name,
                order: index + 1,
                total: moveActions.length,
                priority: action.move.priority || 0,
                speed: getBattleStat(attacker, "speed"),
                trickRoom: trickRoomActive,
                phase: "ready",
                impactShown: false
            };
            game.visualEffects.attackers.clear();
            game.visualEffects.hitMembers.clear();
            game.visualEffects.damagedBefore.clear();
            game.visualEffects.itemEffects.clear();
            game.visualEffects.healedMembers.clear();
            game.visualEffects.healedBefore.clear();
            renderBattle(true);
            await waitForAnimation(240);
            await resolveMoveAction(action);
            if (!game.currentResolution.impactShown) {
                if (game.visualEffects.hitMembers.size || game.visualEffects.itemEffects.size
                    || game.visualEffects.healedMembers.size) {
                    await showMoveImpact();
                } else {
                    game.currentResolution.phase = "impact";
                    renderBattle(true);
                    await waitForAnimation(450);
                }
            } else if (game.visualEffects.itemEffects.size || game.visualEffects.healedMembers.size) {
                game.currentResolution.phase = "impact";
                renderBattle(true);
                await waitForAnimation(850);
            }
            game.visualEffects.attackers.clear();
            game.visualEffects.hitMembers.clear();
            game.visualEffects.damagedBefore.clear();
            game.visualEffects.itemEffects.clear();
            game.visualEffects.healedMembers.clear();
            game.visualEffects.healedBefore.clear();
            game.currentResolution.phase = "complete";
            renderBattle(true);
            await waitForAnimation(180);
        }

        applyEndTurnStatusDamage();
        if (game.visualEffects.hitMembers.size || game.visualEffects.itemEffects.size
            || game.visualEffects.healedMembers.size) {
            game.currentResolution = null;
            renderBattle(true);
            sendOnlineVisualState();
            await waitForAnimation(850);
            game.visualEffects.hitMembers.clear();
            game.visualEffects.damagedBefore.clear();
            game.visualEffects.itemEffects.clear();
            game.visualEffects.healedMembers.clear();
            game.visualEffects.healedBefore.clear();
        }
        decrementFieldEffects();
        clearFaintedSlots(0);
        clearFaintedSlots(1);
        const survivors = game.teams.map((team) => team.members.some((member) => member.currentHp > 0));
        if (!survivors[0] || !survivors[1]) {
            game.winner = survivors[0] === survivors[1] ? -1 : survivors[0] ? 0 : 1;
            stopBattleMusic();
        } else {
            game.turn++;
        }
        game.pendingActions = [[], []];
        game.pendingMega.clear();
        game.pendingTarget = null;
        game.currentPlayer = 0;
        game.currentResolution = null;
        renderBattle();
        if (onlineMode && onlineRole === 0) sendOnlineBattleState();
    }

    function returnToSetup() {
        stopBattleMusic();
        battleAudioStatus.textContent = "";
        if (onlineMode && onlineSocket?.connected) {
            onlineSocket.emit("room:leave", { roomCode: onlineRoomCode });
        }
        game = null;
        resetOnlineSession();
        battleView.hidden = true;
        setupView.hidden = false;
        setSetupMessage("", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function loadPokemonList() {
        startButton.disabled = true;
        setSetupMessage("Carregando Pokémon disponíveis...", false);
        try {
            pokemonList = await api.getPokemonList();
            renderTeamBuilder();
            startButton.disabled = false;
            const selectableCount = pokemonList.filter(isSelectablePokemon).length;
            setSetupMessage(`${selectableCount.toLocaleString("pt-BR")} Pokémon disponíveis para seleção.`, false);
        } catch (error) {
            console.error("Erro ao carregar opções de Pokémon para a batalha:", error);
            setupMessage.innerHTML = 'Não foi possível carregar a lista de Pokémon. <button class="retry-pokemon" type="button">Tentar novamente</button>';
            setupMessage.classList.add("error");
            setupMessage.querySelector(".retry-pokemon").addEventListener("click", loadPokemonList);
        }
    }

    battlefield.addEventListener("click", (event) => {
        const pokemonCard = event.target.closest(".arena-pokemon.is-targetable");
        if (pokemonCard) registerBattleTarget(pokemonCard);
    });
    battlefield.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const pokemonCard = event.target.closest(".arena-pokemon.is-targetable");
        if (!pokemonCard) return;
        event.preventDefault();
        registerBattleTarget(pokemonCard);
    });

    document.querySelector("#pokemon-picker-close").addEventListener("click", () => pickerDialog.close());
    document.querySelector("#switch-picker-close").addEventListener("click", () => {
        if (!switchTarget?.forced) switchDialog.close();
    });
    pickerDialog.addEventListener("close", () => {
        clearTimeout(pickerSearchTimer);
        clearTimeout(movePickerSearchTimer);
        pickerRequestVersion++;
        movePickerRequestVersion++;
        pickerTarget = null;
        pendingPokemon = null;
        pendingHeldItem = null;
        pendingMoves = [];
        pendingMoveDetails = {};
    });
    switchDialog.addEventListener("close", () => {
        if (!switchDialog.open) switchTarget = null;
    });
    switchDialog.addEventListener("cancel", (event) => {
        if (switchTarget?.forced) event.preventDefault();
    });
    pickerSearch.addEventListener("input", () => {
        clearTimeout(pickerSearchTimer);
        pickerSearchTimer = setTimeout(() => {
            pickerPage = 1;
            renderPokemonPicker();
        }, 180);
    });
    pickerGeneration.addEventListener("change", () => {
        pickerPage = 1;
        renderPokemonPicker();
    });
    document.querySelector("#pokemon-detail-back").addEventListener("click", () => {
        showPickerMode("list");
        renderPokemonPicker();
    });
    document.querySelector("#confirm-pokemon-selection").addEventListener("click", confirmPokemonSelection);
    document.querySelector("#item-picker-back").addEventListener("click", () => {
        showPickerMode("details");
        renderPokemonDetail();
    });
    document.querySelector("#move-picker-back").addEventListener("click", () => {
        showPickerMode("details");
        renderPokemonDetail();
    });
    movePickerConfirm.addEventListener("click", confirmMoveSelection);
    movePickerSearch.addEventListener("input", () => {
        clearTimeout(movePickerSearchTimer);
        movePickerSearchTimer = setTimeout(() => {
            movePickerPage = 1;
            renderMovePicker();
        }, 180);
    });
    movePickerPrev.addEventListener("click", () => {
        if (movePickerPage <= 1) return;
        movePickerPage--;
        renderMovePicker();
    });
    movePickerNext.addEventListener("click", () => {
        movePickerPage++;
        renderMovePicker();
    });
    battleMusicButton.addEventListener("click", () => {
        if (battleMusicEnabled) {
            stopBattleMusic();
            battleAudioStatus.textContent = "Música de batalha desativada.";
        } else {
            startBattleMusic();
        }
    });
    battleSfxButton.addEventListener("click", () => {
        soundEffectsEnabled = !soundEffectsEnabled;
        if (soundEffectsEnabled) {
            getAudioContext();
            battleAudioStatus.textContent = "Efeitos sonoros ativados.";
        } else {
            battleAudioStatus.textContent = "Efeitos sonoros desativados.";
        }
        updateBattleAudioControls();
    });
    pickerPrev.addEventListener("click", () => {
        if (pickerPage <= 1) return;
        pickerPage--;
        renderPokemonPicker();
    });
    pickerNext.addEventListener("click", () => {
        pickerPage++;
        renderPokemonPicker();
    });
    pickerRetry.addEventListener("click", renderPokemonPicker);
    createOnlineRoomButton.addEventListener("click", createOnlineRoom);
    joinOnlineRoomButton.addEventListener("click", joinOnlineRoom);
    copyOnlineRoomButton.addEventListener("click", copyOnlineInvite);
    leaveOnlineRoomButton.addEventListener("click", leaveOnlineRoom);
    onlineRoomInput.addEventListener("input", () => {
        onlineRoomInput.value = onlineRoomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    });
    startButton.addEventListener("click", startBattle);
    document.querySelector("#edit-teams").addEventListener("click", returnToSetup);
    loadPokemonList();

    return { loadPokemonList };
})();
