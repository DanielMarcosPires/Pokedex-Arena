// Mantemencao da batalha: parte 136 (Organizada e Limpa)
function returnToSetup() {
    // 1. Interrupção de áudio e limpeza de status de som
    stopBattleMusic();
    battleAudioStatus.textContent = "";

    // 2. Encerramento de sessão online, se ativa
    if (onlineMode && onlineSocket?.connected) {
        onlineSocket.emit("room:leave", { roomCode: onlineRoomCode });
    }

    // 3. Reset do estado de jogo e variáveis de sessão
    game = null;
    resetOnlineSession();

    // 4. Alternância de visualização entre a tela de batalha e a de configuração
    battleView.hidden = true;
    setupView.hidden = false;
    
    // 5. Limpeza de mensagens e rolagem suave para o topo
    setSetupMessage("", false);
    window.scrollTo({ top: 0, behavior: "smooth" });
}