// Mantemencao da batalha: parte 77 (Organizada e Limpa)
function renderActionPanel() {
    positionTurnControls();
    setTargetSelection(false);

    // 1. Tela de Fim de Jogo (Vitória ou Empate)
    if (game.winner !== null) {
        const result = game.winner === -1 ? "Empate!" : `${escapeHTML(teamDisplayName(game.winner))} venceu!`;
        const description = game.winner === -1 
            ? "As duas equipes ficaram sem Pokémon disponíveis." 
            : "A equipe adversária ficou sem Pokémon disponíveis.";

        turnControls.innerHTML = `
            <div class="battle-pass-panel">
                <h3 class="battle-result">${result}</h3>
                <p>${description}</p>
                <button class="battle-pass-button" id="new-match" type="button">Voltar aos times</button>
            </div>
        `;
        document.querySelector("#new-match").addEventListener("click", returnToSetup);
        return;
    }

    // 2. Estados de Espera no Modo Online
    if (onlineMode) {
        if (!onlineBattleReady) {
            renderOnlineWaiting("Aguardando os dois jogadores carregarem a batalha...");
            return;
        }
        if (onlineWaitingForState && onlineForcedSwitchPending) {
            renderOnlineWaiting("Aguardando a entrada do Pokémon...");
            return;
        }
    }

    // 3. Verificação de Substituição Obrigatória (Pokémon que desmaiou)
    const requiredReplacement = getRequiredReplacement();
    if (requiredReplacement) {
        const { teamIndex, activeSlot } = requiredReplacement;
        
        if (onlineMode && teamIndex !== onlineRole) {
            renderOnlineWaiting("Aguardando o adversário escolher um Pokémon reserva...");
            return;
        }

        const pickerAlreadyOpen = switchDialog.open &&
            switchTarget?.teamIndex === teamIndex &&
            switchTarget?.activeSlot === activeSlot &&
            switchTarget?.forced;

        if (!pickerAlreadyOpen) {
            openSwitchPicker(teamIndex, activeSlot, true);
        }
        return;
    }

    // 4. Verificações de Turno Online e Vez do Jogador
    if (onlineMode) {
        if (onlineWaitingForState) {
            renderOnlineWaiting(onlineForcedSwitchPending
                ? "Aguardando a entrada do Pokémon..."
                : "Ação enviada. Aguardando a resolução do turno...");
            return;
        }
        if (onlineRole !== game.currentPlayer) {
            renderOnlineWaiting("Aguardando a jogada do adversário...");
            return;
        }
    }

    const teamIndex = game.currentPlayer;
    const actors = getActiveActors(teamIndex);
    const actions = game.pendingActions[teamIndex];

    // 5. Modo de Seleção de Alvo Pendente (ex: golpes direcionados)
    if (game.pendingTarget) {
        const moveName = formatName(game.pendingTarget.move.name);
        turnControls.innerHTML = `
            <section class="turn-action-panel">
                <h3>Vez de ${escapeHTML(teamDisplayName(teamIndex))} · selecione o alvo de ${escapeHTML(moveName)}</h3>
                <button class="battle-secondary-button" type="button" data-cancel-target>Cancelar</button>
            </section>
        `;
        setTargetSelection(true);
        turnControls.querySelector("[data-cancel-target]").addEventListener("click", () => {
            game.pendingTarget = null;
            renderActionPanel();
        });
        return;
    }

    // 6. Identificação do Ator Atual sem Ação Registrada
    const actor = actors.find(({ activeSlot }) => !actions.some((action) => action.activeSlot === activeSlot));
    if (!actor) {
        console.error("Estado inválido: não há ação pendente para o jogador ativo.");
        return;
    }

    const { memberIndex, activeSlot, member } = actor;
    const megaKey = `${teamIndex}:${activeSlot}`;
    const megaSelected = game.pendingMega.has(megaKey);
    const canMega = canMegaEvolve(member, teamIndex, activeSlot);

    // 7. Renderização dos Botões de Golpes Disponíveis
    const moves = member.moves.map((move, moveIndex) => {
        const power = getMovePower(move, member);
        return `
            <button class="move-choice" type="button" data-use-move="${moveIndex}" data-active-slot="${activeSlot}">
                <span class="move-choice-type type-${escapeHTML(move.type.name)}">${typeLabel(move.type.name)}</span>
                <strong>${formatName(move.name)}</strong>
                <span class="move-choice-power">${power ? `${power} de poder` : "Golpe de status"}</span>
            </button>
        `;
    }).join("");

    const canSwitch = getAvailableSwitches(teamIndex).length > 0;
    const switchLocked = game.fieldEffects.fairyLockTurn === game.turn;

    // 8. Montagem do Markup do Painel de Ações
    const actionMarkup = `
        <article class="turn-action">
            <div class="turn-action-heading">
                <strong>${formatName(member.entry.name)}</strong>
            </div>
            ${member.megaEvolved ? `<p class="mega-status">${formatName(member.pokemon.name)} está Mega Evoluído.</p>` : ""}
            ${canMega || megaSelected ? `
                <button class="mega-evolve-button ${megaSelected ? "is-selected" : ""}" type="button"
                    data-toggle-mega="${activeSlot}" aria-pressed="${megaSelected}">
                    ${megaSelected ? "Mega Evolução ativada · clique para cancelar" : `Mega Evoluir com ${formatName(member.heldItem.replace(/_/g, "-"))}`}
                </button>
            ` : ""}
            <div class="move-choice-grid">${moves}</div>
            <button class="switch-button" type="button" data-switch-active="${activeSlot}" ${!canSwitch || switchLocked ? "disabled" : ""}
                ${switchLocked ? 'title="Fairy Lock impede trocas neste turno"' : ""}>
                ${switchLocked ? "Trocas bloqueadas por Fairy Lock" : "Trocar Pokémon"}
            </button>
        </article>
    `;

    turnControls.innerHTML = `
        <section class="turn-action-panel">
            <h3>Vez de ${escapeHTML(teamDisplayName(teamIndex))} · turno ${game.turn}</h3>
            <div class="turn-action-list">${actionMarkup}</div>
        </section>
    `;

    // 9. Registro de Event Listeners para os botões do painel
    turnControls.querySelectorAll("[data-use-move]").forEach((button) => {
        button.addEventListener("click", () => {
            const activeSlot = Number(button.dataset.activeSlot);
            const memberIndex = game.active[teamIndex][activeSlot];
            const member = game.teams[teamIndex].members[memberIndex];
            const megaKey = `${teamIndex}:${activeSlot}`;
            
            const action = {
                teamIndex,
                activeSlot,
                attackerIndex: memberIndex,
                move: member.moves[Number(button.dataset.useMove)],
                megaEvolve: game.pendingMega.has(megaKey)
            };
            
            const targetName = action.move.target?.name;
            
            if (action.move.name === "after-you" && game.format === 1) {
                registerAction({ ...action, targetUnavailable: true });
                return;
            }
            if (game.format === 1 && (targetName === "ally" || action.move.meta?.category?.name === "heal")) {
                registerAction({ ...action, targetUnavailable: true });
                return;
            }
            if (game.format === 2 && ["selected-pokemon", "user-or-ally", "ally"].includes(targetName)) {
                game.pendingTarget = action;
                renderActionPanel();
            } else {
                const selfTarget = ["user", "user-or-ally", "ally"].includes(targetName);
                registerAction({
                    ...action,
                    targetTeamIndex: selfTarget ? teamIndex : 1 - teamIndex,
                    targetActiveSlot: selfTarget ? activeSlot : 0
                });
            }
        });
    });

    turnControls.querySelectorAll("[data-toggle-mega]").forEach((button) => {
        button.addEventListener("click", () => {
            const activeSlot = Number(button.dataset.toggleMega);
            const megaKey = `${teamIndex}:${activeSlot}`;
            
            if (game.pendingMega.has(megaKey)) {
                game.pendingMega.delete(megaKey);
            } else {
                const memberIndex = game.active[teamIndex][activeSlot];
                const member = game.teams[teamIndex].members[memberIndex];
                if (!canMegaEvolve(member, teamIndex, activeSlot)) return;
                game.pendingMega.add(megaKey);
            }
            renderActionPanel();
        });
    });

    turnControls.querySelectorAll("[data-switch-active]").forEach((button) => {
        button.addEventListener("click", () => {
            const activeSlot = Number(button.dataset.switchActive);
            game.pendingMega.delete(`${teamIndex}:${activeSlot}`);
            openSwitchPicker(teamIndex, activeSlot);
        });
    });
}