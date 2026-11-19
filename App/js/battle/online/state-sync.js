// Mantemencao da batalha: parte 84 a 87 (Organizadas e Limpas)

// 1. Aplica e sincroniza o estado completo da batalha recebido do servidor (modo online)
function applyOnlineGameState(state, isResolving = false) {
    if (!state || !Array.isArray(state.teams) || state.teams.length !== 2 ||
        state.teams.some((team) => !Array.isArray(team.members) || team.members.length !== 6)) {
        throw new Error("O servidor enviou um estado de batalha inválido.");
    }

    if (isResolving) {
        playOnlineStateSounds(state);
    }

    const typeDetails = game.typeDetails;
    const localTeams = game.teams;
    
    // Mapeamento de golpes conhecidos para reconstrução dos objetos de movimento
    const knownMoves = new Map(
        localTeams.flatMap((team) =>
            team.members.flatMap((member) => [...member.originalMoves, ...member.moves])
        ).map((move) => [move.name, move])
    );

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

    // Atualiza o objeto de estado global da partida
    game = {
        ...state,
        teams,
        typeDetails,
        pendingMega: new Set(state.pendingMega),
        visualEffects: state.visualEffects ? {
            attackers: new Set(state.visualEffects.attackers),
            hitMembers: new Set(state.visualEffects.hitMembers),
            damagedBefore: new Map(state.visualEffects.damagedBefore),
            damageAmounts: new Map(state.visualEffects.damageAmounts || []),
            damageKinds: new Map(state.visualEffects.damageKinds || []),
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


// 2. Reproduz efeitos sonoros contextuais baseados nas mudanças de estado visual recebidas
function playOnlineStateSounds(state) {
    if (!soundEffectsEnabled) return;
    
    const previous = game.visualEffects;
    const effects = state.visualEffects;

    if (state.currentResolution?.phase === "attacking" && game.currentResolution?.phase !== "attacking") {
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


// 3. Envia o estado visual atual para o adversário (responsabilidade do host/player 0)
function sendOnlineVisualState() {
    if (onlineRole !== 0 || !onlineBattleStarted || !onlineBattleReady || !onlineSocket?.connected) return;
    
    onlineSocket.emit("battle:visual-state", {
        roomCode: onlineRoomCode,
        state: serializeOnlineGame()
    });
}


// 4. Sincroniza o estado de jogo atualizado da partida com o servidor e o outro jogador
function sendOnlineBattleState() {
    if (onlineRole !== 0 || !onlineBattleStarted || !onlineSocket?.connected) return;
    
    onlineSocket.emit("battle:state", {
        roomCode: onlineRoomCode,
        turn: game.turn,
        state: serializeOnlineGame()
    }, (response) => {
        if (!response?.ok) {
            setOnlineLobbyStatus(response?.error || "Falha ao sincronizar a batalha.", true);
        }
    });
}