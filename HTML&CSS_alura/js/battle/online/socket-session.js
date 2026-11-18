// Mantemencao da batalha: parte 12 a 15 (Organizadas e Limpas)

// 1. Garante que o socket do cliente está carregado, vinculado e conectado ao servidor com timeout de segurança
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


// 2. Emite uma requisição assíncrona via socket com tratamento de timeout e resposta padrão
async function emitOnlineRequest(eventName, payload) {
    const socket = await ensureOnlineSocket();
    
    return new Promise((resolve, reject) => {
        socket.timeout(10000).emit(eventName, payload, (timeoutError, response) => {
            if (timeoutError) {
                reject(new Error("O servidor não respondeu a tempo."));
                return;
            }
            if (response?.ok) {
                resolve(response);
            } else {
                reject(new Error(response?.error || "O servidor recusou a solicitação."));
            }
        });
    });
}


// 3. Reseta todas as variáveis de estado e sessão do modo online, retornando aos menus locais
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


// 4. Cria uma nova sala de batalha online no servidor e configura o papel do jogador como host (Role 0)
async function createOnlineRoom() {
    createOnlineRoomButton.disabled = true;
    
    if (soundEffectsEnabled) {
        getAudioContext();
    }

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