// Mantemencao da batalha: parte 130 e 131 (Organizadas e Limpas)

// 1. Força a troca de um Pokémon em campo (por efeitos de golpes como Roar ou Dragon Tail), tratando tanto o modo local quanto o online
async function forceSwitchTarget(target, moveName) {
    const reserves = getAvailableSwitches(target.teamIndex);
    
    if (!reserves.length) {
        game.log.push(`${plainName(target.member.entry.name)} não tinha reserva para ser trocado por ${formatName(moveName)}.`);
        return false;
    }

    // Se estiver no modo online e o alvo pertencer ao adversário remoto, emite a requisição via socket
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

    // Abre o seletor de substitutos para o jogador local realizar a troca forçada
    await new Promise((resolve) => 
        openSwitchPicker(target.teamIndex, target.activeSlot, true, moveName, resolve)
    );
    
    return true;
}


// 2. Controla a fase de impacto visual de um golpe, atualizando a interface, enviando o estado de rede e aguardando as animações
async function showMoveImpact() {
    if (!game.currentResolution || game.currentResolution.impactShown) return;

    game.currentResolution.phase = "impact";
    game.visualEffects.attackers.clear();

    renderBattle(true);
    sendOnlineVisualState();

    const hasItemEffect = game.visualEffects.itemEffects.size || game.visualEffects.healedMembers.size;
    
    // Aguarda o tempo adequado de animação dependendo da ocorrência de danos ou efeitos de itens
    await waitForAnimation(game.visualEffects.hitMembers.size || hasItemEffect ? 850 : 500);
    
    game.currentResolution.impactShown = true;
}