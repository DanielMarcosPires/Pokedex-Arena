// Mantemencao da batalha: parte 64 a 66 (Organizadas e Limpas)

// 1. Renderiza a barra com todos os efeitos de campo ativos (Clima, Terrenos, Telas, Hazards e Salas)
function renderFieldEffects() {
    const effects = [];
    const addTimedEffect = (label, turns) => {
        if (turns > 0) effects.push(`${label} · ${turns} turnos`);
    };

    // Trick Room
    if (game.fieldEffects.trickRoomTurns > 0) {
        effects.push(`Trick Room · ${game.fieldEffects.trickRoomTurns} turnos`);
    }

    // Tailwind por time
    game.fieldEffects.tailwindTurns.forEach((turns, teamIndex) => {
        addTimedEffect(`${teamDisplayName(teamIndex)} · Tailwind`, turns);
    });

    // Clima ativo
    if (game.fieldEffects.weather.turns > 0) {
        const weatherLabels = { rain: "Chuva", sun: "Sol", sandstorm: "Tempestade de areia", hail: "Granizo", snow: "Neve" };
        addTimedEffect(weatherLabels[game.fieldEffects.weather.name], game.fieldEffects.weather.turns);
    }

    // Terreno ativo
    if (game.fieldEffects.terrain.turns > 0) {
        const terrainLabels = { electric: "Campo elétrico", grassy: "Campo de grama", misty: "Campo enevoado", psychic: "Campo psíquico" };
        addTimedEffect(terrainLabels[game.fieldEffects.terrain.name], game.fieldEffects.terrain.turns);
    }

    // Telas defensivas e proteções por time (Reflect, Light Screen, Safeguard, etc.)
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

    // Hazards de entrada por time (Stealth Rock, Spikes, Toxic Spikes, Sticky Web)
    game.fieldEffects.hazards.forEach((hazards, teamIndex) => {
        const active = [];
        if (hazards.stealthRock) active.push("Stealth Rock");
        if (hazards.spikes) active.push(`Spikes ×${hazards.spikes}`);
        if (hazards.toxicSpikes) active.push(`Toxic Spikes ×${hazards.toxicSpikes}`);
        if (hazards.stickyWeb) active.push("Sticky Web");
        
        if (active.length) {
            effects.push(`${teamDisplayName(teamIndex)} · ${active.join(", ")}`);
        }
    });

    // Condições globais de campo (Gravity, Rooms, Esportes)
    addTimedEffect("Gravity", game.fieldEffects.gravityTurns);
    addTimedEffect("Wonder Room", game.fieldEffects.wonderRoomTurns);
    addTimedEffect("Magic Room", game.fieldEffects.magicRoomTurns);
    addTimedEffect("Mud Sport", game.fieldEffects.mudSportTurns);
    addTimedEffect("Water Sport", game.fieldEffects.waterSportTurns);

    if (!effects.length) return "";

    return `
        <div class="battle-field-effects" aria-label="Efeitos de campo ativos">
            ${effects.map((effect) => `<span>${escapeHTML(effect)}</span>`).join("")}
        </div>
    `;
}


// 2. Renderiza o banner informativo de ordem de execução e prioridade durante o turno de combate
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

    const phase = {
        attacking: "Atacando",
        impact: "Golpe aplicado",
        complete: "Ação concluída"
    }[current.phase] || "Próximo ataque";

    return `
        <div class="battle-order-banner" role="status" aria-live="polite">
            <span class="battle-order-position">${current.order}/${current.total}</span>
            <span class="battle-order-details">
                <strong>${escapeHTML(formatName(current.pokemonName))} · ${escapeHTML(formatName(current.moveName))}</strong>
                <span>${position} · ${priority} · ${speedRule}</span>
            </span>
            <span class="battle-order-phase">${phase}</span>
        </div>
    `;
}


// 3. Atualiza o histórico de logs da batalha incrementalmente, mantendo o limite máximo de mensagens visíveis
function renderBattleLog() {
    game.log.slice(renderedLogLength).forEach((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        battleLog.append(item);
    });
    
    renderedLogLength = game.log.length;
    
    // Mantém no máximo 16 itens visíveis no histórico de log
    while (battleLog.children.length > 16) {
        battleLog.firstElementChild.remove();
    }
}