// Mantemencao da batalha: parte 61 a 63 (Organizadas e Limpas)

// 1. Renderiza o card individual de um Pokémon ativo na arena (incluindo barras de HP, efeitos visuais, itens e animações)
function renderArenaPokemon(teamIndex, activeSlot) {
    const memberIndex = game.active[teamIndex][activeSlot];
    
    if (memberIndex === null) {
        return `
            <article class="arena-pokemon arena-pokemon-empty">
                <span>Sem Pokémon ativo</span>
            </article>
        `;
    }

    const member = game.teams[teamIndex].members[memberIndex];
    const percent = Math.max(0, Math.round(member.currentHp / member.maxHp * 100));
    
    // Recuperação de efeitos visuais do estado global
    const effectKey = `${teamIndex}:${memberIndex}`;
    const effects = game.visualEffects;
    const itemEffect = effects?.itemEffects.get(effectKey);
    const damageKind = effects?.damageKinds.get(effectKey) || "move";
    
    const isCurrentAttacker = game.currentResolution?.teamIndex === teamIndex &&
        game.currentResolution?.attackerIndex === memberIndex;
        
    const hpBefore = effects?.damagedBefore.get(effectKey) ??
        effects?.healedBefore.get(effectKey) ??
        member.currentHp;
        
    const damageAmount = effects?.damageAmounts.get(effectKey) ||
        Math.max(0, hpBefore - member.currentHp);
        
    const critical = percent <= 25;
    
    const types = getMemberTypeNames(member)
        .map((type) => `<span class="type-tag type-${escapeHTML(type)}">${typeLabel(type)}</span>`)
        .join("") || '<span class="type-tag">Sem tipo</span>';
        
    const displayName = member.megaEvolved ? member.pokemon.name : member.entry.name;

    // Montagem dinâmica de classes CSS para animações de dano, cura, ataque e mega evolução
    const cardClasses = [
        "arena-pokemon",
        isCurrentAttacker ? "is-current-attacker" : "",
        effects?.attackers.has(effectKey) ? "is-attacking" : "",
        effects?.hitMembers.has(effectKey) ? "is-hit" : "",
        effects?.hitMembers.has(effectKey) && damageKind === "status" ? "is-status-hit" : "",
        effects?.healedMembers.has(effectKey) ? "is-item-healing" : "",
        itemEffect ? `is-item-${itemEffect.kind}` : "",
        effects?.megaEvolved.has(effectKey) ? "is-mega-evolving" : "",
        critical ? "is-critical" : ""
    ].filter(Boolean).join(" ");

    return `
        <article class="${cardClasses}" data-team-index="${teamIndex}" data-active-slot="${activeSlot}">
            <div class="arena-pokemon-art">
                <img src="${escapeHTML(imageUrl(member.pokemon))}" alt="${formatName(displayName)}">
                ${effects?.hitMembers.has(effectKey) && damageAmount > 0
                    ? `<span class="damage-effect-burst ${damageKind === "status" ? "is-status" : ""}" aria-hidden="true">
                        ${damageKind === "status" ? "STATUS · " : ""}−${damageAmount} HP
                       </span>`
                    : ""}
                ${itemEffect ? `<span class="item-effect-burst is-${itemEffect.kind}">${escapeHTML(itemEffect.label)}</span>` : ""}
            </div>
            
            <div class="arena-pokemon-info">
                <span class="arena-pokemon-number">#${String(member.entry.id).padStart(4, "0")}</span>
                <strong class="arena-pokemon-name">${formatName(displayName)}</strong>
                
                ${member.heldItem ? `
                    <span class="arena-held-item">
                        <img src="${escapeHTML(itemSpriteUrl(member.heldItem))}" alt="" onerror="this.hidden = true">
                        ${formatName(member.heldItem.replace(/_/g, "-"))}
                    </span>
                ` : ""}
                
                <span class="arena-pokemon-types">${types}</span>
                
                <div class="battle-hp-track">
                    <span class="battle-hp-fill ${critical ? "low" : ""} ${effects?.hitMembers.has(effectKey) ? "hp-draining" : ""} ${effects?.healedMembers.has(effectKey) ? "hp-restoring" : ""}"
                        style="--hp-from:${hpBefore / member.maxHp};--hp-to:${member.currentHp / member.maxHp}">
                    </span>
                </div>
                
                <span class="arena-hp-text ${critical ? "is-critical" : ""}">${member.currentHp}/${member.maxHp} HP</span>
            </div>
        </article>
    `;
}


// 2. Retorna o nome amigável para exibição do time na interface
function teamDisplayName(teamIndex) {
    const teamName = game.teams[teamIndex].name;
    const defaultName = `Jogador ${teamIndex + 1}`;
    return teamName === defaultName ? `Time ${teamIndex + 1}` : teamName;
}


// 3. Renderiza o painel completo do lado de um time na arena (cabeçalho, status das Pokéballs e Pokémon ativos)
function renderBattleTeam(teamIndex) {
    const team = game.teams[teamIndex];
    
    const activePokemon = game.active[teamIndex]
        .map((_, activeSlot) => renderArenaPokemon(teamIndex, activeSlot))
        .join("");

    // Renderiza o indicador de status (Pokéball) de cada membro do time
    const pokeballs = team.members.map((member, memberIndex) => {
        const defeated = member.currentHp <= 0;
        const active = game.active[teamIndex].includes(memberIndex);
        const status = defeated ? "derrotado" : active ? "ativo" : "disponível";
        const label = `${formatName(member.entry.name)}: ${status}, ${member.currentHp}/${member.maxHp} HP`;
        
        return `
            <span class="team-pokeball ${defeated ? "is-defeated" : active ? "is-active" : "is-available"}"
                role="img" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">
                <span class="team-pokeball-center" aria-hidden="true"></span>
            </span>
        `;
    }).join("");

    return `
        <section class="arena-side arena-team-${teamIndex + 1}">
            <div class="arena-side-heading">
                <h3>${escapeHTML(teamDisplayName(teamIndex))}</h3>
                <div class="team-pokeballs" role="group" aria-label="Pokémon do time ${teamIndex + 1}">
                    ${pokeballs}
                </div>
            </div>
            <div class="arena-active-row">${activePokemon}</div>
        </section>
    `;
}