// Mantemencao da batalha: parte 103 (Organizada e Limpa)

// Aplica movimentos de campo, clima, terrenos, barreiras defensivas, armadilhas e efeitos especiais em área
function applyFieldMove(action, move) {
    const { fieldEffects } = game;
    const teamIndex = action.teamIndex;
    const attackerSlot = action.attackerIndex;
    const member = game.teams[teamIndex].members[attackerSlot];
    const effects = member.moveEffects || (member.moveEffects = {});
    
    const attackerName = plainName(member.entry.name);
    const memberName = attackerName;
    const name = move.name;

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

    // 1. Stockpile (Acúmulo de energia defensiva)
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

    // 2. Swallow (Consome os acúmulos de Stockpile para recuperar HP)
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

    // 3. Trick Room e Tailwind
    if (name === "trick-room") {
        fieldEffects.trickRoomTurns = fieldEffects.trickRoomTurns > 0 ? 0 : 5;
        game.log.push(fieldEffects.trickRoomTurns
            ? `${attackerName} distorceu a ordem dos ataques com Trick Room.`
            : `${attackerName} encerrou o efeito de Trick Room.`);
    } else if (name === "tailwind") {
        fieldEffects.tailwindTurns[teamIndex] = 4;
        game.log.push(`${attackerName} criou Tailwind; a velocidade do time aumentará por quatro turnos.`);
    } 
    // 4. Clima (Weather)
    else if (weatherMoves[name]) {
        const weather = weatherMoves[name];
        fieldEffects.weather = { name: weather, turns: 5 };
        const labels = { rain: "chuva", sun: "sol", sandstorm: "tempestade de areia", hail: "granizo", snow: "neve" };
        game.log.push(`${attackerName} mudou o clima para ${labels[weather]}.`);
    } 
    // 5. Terrenos (Terrains)
    else if (terrainMoves[name]) {
        const terrain = terrainMoves[name];
        fieldEffects.terrain = { name: terrain, turns: 5 };
        const labels = { electric: "elétrico", grassy: "gramado", misty: "enevoado", psychic: "psíquico" };
        game.log.push(`${attackerName} criou o campo ${labels[terrain]}.`);
    } 
    // 6. Telas de Proteção (Screens: Reflect, Light Screen, Aurora Veil)
    else if (["reflect", "light-screen", "aurora-veil"].includes(name)) {
        const screen = name === "light-screen" ? "lightScreen" : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        if (name === "aurora-veil" && !["hail", "snow"].includes(fieldEffects.weather.name)) {
            game.log.push(`${attackerName} tentou usar Aurora Veil, mas precisa de granizo ou neve.`);
        } else {
            fieldEffects.screens[teamIndex][screen] = 5;
            game.log.push(`${attackerName} protegeu o time com ${formatName(name)}.`);
        }
    } 
    // 7. Proteções de Equipe (Safeguard, Mist, Lucky Chant)
    else if (name === "safeguard" || name === "mist" || name === "lucky-chant") {
        const effect = name === "safeguard"
            ? "safeguardTurns"
            : name === "mist" ? "mistTurns" : "luckyChantTurns";
        fieldEffects[effect][teamIndex] = 5;
        game.log.push(`${attackerName} protegeu o campo do time com ${formatName(name)}.`);
    } 
    // 8. Armadilhas de Entrada (Hazards: Stealth Rock, Spikes, Toxic Spikes, Sticky Web)
    else if (name === "stealth-rock") {
        fieldEffects.hazards[1 - teamIndex].stealthRock = true;
        game.log.push(`${attackerName} espalhou pedras pontiagudas no campo adversário.`);
    } else if (name === "spikes" || name === "toxic-spikes") {
        const hazard = name === "spikes" ? "spikes" : "toxicSpikes";
        const limit = name === "spikes" ? 3 : 2;
        fieldEffects.hazards[1 - teamIndex][hazard] = Math.min(
            limit, fieldEffects.hazards[1 - teamIndex][hazard] + 1
        );
        game.log.push(`${attackerName} espalhou ${formatName(name)} no campo adversário.`);
    } else if (name === "sticky-web") {
        fieldEffects.hazards[1 - teamIndex].stickyWeb = true;
        game.log.push(`${attackerName} cobriu o campo adversário com Sticky Web.`);
    } 
    // 9. Efeitos utilitários e restrições globais (Haze, Gravity, Wonder Room, etc.)
    else if (name === "haze") {
        game.teams.forEach((team) => team.members.forEach((memberItem) => { memberItem.statStages = {}; }));
        game.log.push(`${attackerName} dissipou todas as alterações de atributos com Haze.`);
    } else if (name === "gravity") {
        fieldEffects.gravityTurns = 5;
        game.log.push(`${attackerName} aumentou a gravidade por cinco turnos.`);
    } else if (name === "wonder-room") {
        fieldEffects.wonderRoomTurns = 5;
        game.log.push(`${attackerName} distorceu as defesas com Wonder Room.`);
    } else if (name === "mud-sport" || name === "water-sport") {
        const effect = name === "mud-sport" ? "mudSportTurns" : "waterSportTurns";
        fieldEffects[effect] = 5;
        game.log.push(`${attackerName} ativou ${formatName(name)} por cinco turnos.`);
    } else if (name === "crafty-shield") {
        fieldEffects.craftyShieldTurn[teamIndex] = game.turn;
        game.log.push(`${attackerName} protegeu o time contra golpes de status neste turno.`);
    } else if (name === "magic-room") {
        fieldEffects.magicRoomTurns = 5;
        game.log.push(`${attackerName} suprimiu os efeitos de itens por cinco turnos.`);
    } else if (name === "ion-deluge") {
        fieldEffects.ionDelugeTurn = game.turn;
        game.log.push(`${attackerName} carregou o campo com energia elétrica.`);
    } else if (name === "fairy-lock") {
        fieldEffects.fairyLockTurn = game.turn + 1;
        game.log.push(`${attackerName} impediu trocas durante o próximo turno.`);
    } else if (name === "happy-hour") {
        game.log.push(`${attackerName} usou Happy Hour; o prêmio em dinheiro não é usado nesta batalha.`);
    } 
    // 10. Wish e Aromatherapy / Heal Bell
    else if (name === "wish") {
        const activeSlot = game.active[teamIndex].indexOf(attackerSlot);
        if (activeSlot < 0 || fieldEffects.wishes[teamIndex][activeSlot]) return false;
        
        fieldEffects.wishes[teamIndex][activeSlot] = {
            amount: Math.floor(member.maxHp / 2),
            appliedTurn: game.turn,
            dueTurn: game.turn + 1
        };
        game.log.push(`${attackerName} fez um desejo que será atendido no próximo turno.`);
    } else if (name === "aromatherapy" || name === "heal-bell") {
        let cured = false;
        game.teams[teamIndex].members.forEach((memberItem) => {
            if (!memberItem.status && memberItem.confusionTurns <= 0) return;
            memberItem.status = null;
            memberItem.confusionTurns = 0;
            cured = true;
        });
        game.log.push(cured
            ? `${attackerName} curou as condições de status da equipe com ${formatName(name)}.`
            : `${attackerName} usou ${formatName(name)}, mas a equipe não tinha condições para curar.`);
    } else {
        return false;
    }
    
    return true;
}