// Mantemencao da batalha: parte 82 e 83 (Organizadas e Limpas)

// 1. Processa e hidrata as ações enviadas pelo adversário remoto no turno atual da partida online
async function handleOnlineTeamActions(payload) {
    if (!onlineBattleStarted || !onlineBattleReady || payload?.turn !== game.turn) return;
    
    const remoteTeamIndex = onlineRole === 0 ? 1 : 0;
    if (payload?.teamIndex !== remoteTeamIndex) return;

    // Hidrata as ações recebidas da rede convertendo nomes em referências completas
    const actions = hydrateOnlineActions(remoteTeamIndex, payload.actions);
    game.pendingActions[remoteTeamIndex] = actions;

    // Se o jogador atual é o cliente (Role 1), atualiza o estado para aguardar a resolução local ou do host
    if (onlineRole === 1) {
        game.currentPlayer = 1;
        onlineWaitingForState = false;
        renderBattle();
        return;
    }

    // Se o host (Role 0) recebeu todas as ações necessárias, inicia a resolução do turno
    onlineWaitingForState = false;
    await resolveTurn();
}


// 2. Serializa o estado global completo do jogo em um objeto plano seguro para transmissão via WebSocket
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
            damageAmounts: [...effects.damageAmounts],
            damageKinds: [...effects.damageKinds],
            itemEffects: [...effects.itemEffects],
            healedMembers: [...effects.healedMembers],
            healedBefore: [...effects.healedBefore],
            megaEvolved: [...effects.megaEvolved]
        } : null
    };
}