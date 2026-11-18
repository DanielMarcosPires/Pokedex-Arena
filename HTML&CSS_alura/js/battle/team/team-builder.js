// Mantemencao da batalha: parte 39 (Organizada e Limpa)
function renderTeamBuilder() {
    // 1. Renderização estrutural dos painéis de ambos os times
    teamBuilder.innerHTML = [0, 1].map((teamIndex) => {
        const isOnlineHidden = onlineMode && teamIndex !== onlineRole ? "online-opponent-hidden" : "";
        const isTeamLocked = teamRandomizing[teamIndex] || onlineTeamSubmitted;
        const isTeamLoading = pokemonTeams[teamIndex].some((slot) => slot?.loading);

        // Texto dinâmico do botão de sortear
        let randomButtonText = "Sortear 6 Pokémon";
        if (teamRandomizing[teamIndex]) {
            randomButtonText = "Sorteando...";
        } else if (isTeamLoading) {
            randomButtonText = "Aguarde carregamento";
        }

        return `
            <section class="team-panel ${isOnlineHidden}">
                <div class="team-panel-heading">
                    <h3>${onlineMode ? "Seu time" : `Time ${teamIndex + 1}`}</h3>
                    
                    <div class="team-panel-controls">
                        <label class="team-name-control">Nome do jogador
                            <input type="text" maxlength="24" value="${escapeHTML(playerNames[teamIndex])}" 
                                data-player-name="${teamIndex}" ${onlineTeamSubmitted ? "disabled" : ""}>
                        </label>
                        
                        <label class="move-mode-control">Configuração dos golpes
                            <select data-move-mode="${teamIndex}" ${isTeamLocked ? "disabled" : ""}>
                                <option value="manual" ${teamModes[teamIndex] === "manual" ? "selected" : ""}>Manual · escolher 4</option>
                                <option value="automatic" ${teamModes[teamIndex] === "automatic" ? "selected" : ""}>Automática · níveis mais altos</option>
                                <option value="random" ${teamModes[teamIndex] === "random" ? "selected" : ""}>Aleatória · sortear 4</option>
                            </select>
                        </label>
                    </div>

                    <button class="team-random-button" type="button" data-random-team="${teamIndex}"
                        ${isTeamLocked || isTeamLoading ? "disabled" : ""}>
                        ${randomButtonText}
                    </button>
                </div>

                <div class="team-slots">
                    ${pokemonTeams[teamIndex].map((slot, slotIndex) => renderSlot(slot, teamIndex, slotIndex)).join("")}
                </div>
            </section>
        `;
    }).join("");

    // 2. Registro de Event Listeners nos elementos recém-renderizados
    teamBuilder.querySelectorAll(".team-slot").forEach((slot) => {
        slot.addEventListener("click", () => openPokemonSlot(
            Number(slot.dataset.team), Number(slot.dataset.slot)
        ));
    });

    teamBuilder.querySelectorAll("[data-random-team]").forEach((button) => {
        button.addEventListener("click", () => randomizeTeam(Number(button.dataset.randomTeam)));
    });

    teamBuilder.querySelectorAll("[data-player-name]").forEach((input) => {
        input.addEventListener("input", () => {
            playerNames[Number(input.dataset.playerName)] = input.value;
        });
    });

    teamBuilder.querySelectorAll("[data-move-mode]").forEach((select) => {
        select.addEventListener("change", () => {
            teamModes[Number(select.dataset.moveMode)] = select.value;
            renderTeamBuilder();
        });
    });

    teamBuilder.querySelectorAll(".online-opponent-hidden").forEach((panel) => {
        panel.setAttribute("aria-hidden", "true");
    });

    // 3. Atualização de estado global de botões e lobby
    startButton.disabled = teamRandomizing.some(Boolean) || onlineTeamSubmitted;
    updateOnlineLobby();
}