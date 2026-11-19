// Mantemencao da batalha: parte 16 a 20 (Organizadas e Limpas)

// 1. Entra em uma sala de batalha online existente utilizando o código de 6 caracteres fornecido
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
    
    if (soundEffectsEnabled) {
        getAudioContext();
    }

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


// 2. Sai da sala de batalha online atual e reseta a sessão do lobby
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


// 3. Copia o código da sala atual para a área de transferência do usuário
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


// 4. Serializa o time local para um formato leve pronto para transmissão via rede
function serializeOnlineTeam(teamIndex) {
    const team = pokemonTeams[teamIndex];
    
    const moveNames = team.map((slot) => 
        chooseMoves(slot, teamModes[teamIndex]).map(({ move }) => move.name)
    );

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


// 5. Valida, serializa e envia o time do jogador atual para o servidor da sala online
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