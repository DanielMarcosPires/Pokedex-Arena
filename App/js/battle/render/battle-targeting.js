// Mantemencao da batalha: parte 75 e 76 (Organizadas e Limpas)

// 1. Alterna o estado visual e interativo dos Pokémon na arena para permitir ou bloquear a escolha de alvos de um golpe
function setTargetSelection(enabled) {
    battlefield.querySelectorAll(".arena-pokemon[data-team-index]").forEach((pokemonCard) => {
        const teamIndex = Number(pokemonCard.dataset.teamIndex);
        const activeSlot = Number(pokemonCard.dataset.activeSlot);
        const memberIndex = game.active[teamIndex][activeSlot];
        const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
        
        const pending = game.pendingTarget;
        const sameAsAttacker = teamIndex === pending?.teamIndex && activeSlot === pending?.activeSlot;
        const canTargetTeam = pending && canSelectBattleTarget(pending, teamIndex);
        
        // Verifica se o Pokémon em questão pode ser selecionado como alvo atual
        const isTargetable = enabled &&
            canTargetTeam &&
            !sameAsAttacker &&
            member &&
            member.currentHp > 0;

        pokemonCard.classList.toggle("is-targetable", Boolean(isTargetable));

        // Adiciona ou remove atributos de acessibilidade e interatividade
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


// 2. Registra o alvo escolhido pelo jogador na arena e conclui a ação pendente
function registerBattleTarget(pokemonCard) {
    if (!game.pendingTarget) return;

    const teamIndex = Number(pokemonCard.dataset.teamIndex);
    const activeSlot = Number(pokemonCard.dataset.activeSlot);
    const action = game.pendingTarget;
    
    const canTargetTeam = canSelectBattleTarget(action, teamIndex);

    // Validações de segurança para o alvo selecionado
    if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex > 1 ||
        !canTargetTeam || !Number.isInteger(activeSlot) ||
        (teamIndex === action.teamIndex && activeSlot === action.activeSlot)) {
        return;
    }

    const memberIndex = game.active[teamIndex][activeSlot];
    const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
    
    if (!member || member.currentHp <= 0) return;

    // Limpa a pendência de alvo e registra a ação completa com o alvo definido
    game.pendingTarget = null;
    registerAction({ ...action, targetTeamIndex: teamIndex, targetActiveSlot: activeSlot });
}