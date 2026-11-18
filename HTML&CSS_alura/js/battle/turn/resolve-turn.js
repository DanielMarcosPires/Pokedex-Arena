// Mantemencao da batalha: parte 135 (Organizada e Limpa)
    async function resolveTurn() {
        const actions = game.pendingActions.flat().filter(Boolean);

        // Função auxiliar para resetar os efeitos visuais de forma centralizada
        const clearVisuals = () => {
            if (!game.visualEffects) return;
            game.visualEffects.attackers?.clear();
            game.visualEffects.hitMembers?.clear();
            game.visualEffects.damagedBefore?.clear();
            game.visualEffects.damageAmounts?.clear();
            game.visualEffects.damageKinds?.clear();
            game.visualEffects.itemEffects?.clear();
            game.visualEffects.healedMembers?.clear();
            game.visualEffects.healedBefore?.clear();
            game.visualEffects.statChanges?.clear();
            game.visualEffects.protectedMembers?.clear();
        };

        // Inicialização do objeto de efeitos visuais
        game.visualEffects = {
            attackers: new Set(),
            hitMembers: new Set(),
            damagedBefore: new Map(),
            damageAmounts: new Map(),
            damageKinds: new Map(),
            itemEffects: new Map(),
            healedMembers: new Set(),
            healedBefore: new Map(),
            megaEvolved: new Set(),
            statChanges: new Set(),
            protectedMembers: new Set()
        };

        // Reseta os contadores de dano do turno para cada membro
        game.teams.forEach((team) => team?.members?.forEach((member) => {
            if (member) {
                member.damageTakenThisTurn = 0;
                member.lastDamageClassThisTurn = null;
            }
        }));

        // 1. Processamento de Mega Evoluções
        actions.filter((action) => action.megaEvolve).forEach((action) => {
            const member = game.teams[action.teamIndex]?.members[action.attackerIndex];
            if (game.active[action.teamIndex]?.[action.activeSlot] !== action.attackerIndex
                || !member || !megaEvolveMember(action.teamIndex, action.attackerIndex)) {
                const name = member?.entry?.name ? plainName(member.entry.name) : "Pokémon";
                game.log.push(`${name} não pôde Mega Evoluir.`);
                action.megaEvolve = false;
            }
        });

        if (game.visualEffects.megaEvolved.size) {
            renderBattle(true);
            sendOnlineVisualState();
            await waitForAnimation(1500);
            game.visualEffects.megaEvolved.clear();
        }

        // 2. Processamento de Trocas Voluntárias
        actions.filter((action) => Number.isInteger(action.switchToIndex)).forEach((action) => {
            if (game.fieldEffects.fairyLockTurn === game.turn) {
                game.log.push("Uma troca foi impedida por Fairy Lock.");
                return;
            }
            const team = game.teams[action.teamIndex];
            const outgoing = team?.members[action.attackerIndex];
            const incoming = team?.members[action.switchToIndex];
            
            if (!outgoing || !incoming || !canVoluntarilySwitch(outgoing)) {
                if (outgoing) {
                    game.log.push(`${plainName(outgoing.entry.name)} não pode ser trocado agora.`);
                }
                return;
            }

            outgoing.statStages = {};
            outgoing.confusionTurns = 0;
            outgoing.moveEffects = {};
            setMemberTypeNames(outgoing, memberResetTypes(outgoing));
            outgoing.moves = [...outgoing.originalMoves];
            outgoing.transformedStats = null;
            outgoing.protectionChain = 0;
            outgoing.criticalStage = 0;
            
            game.active[action.teamIndex][action.activeSlot] = action.switchToIndex;
            incoming.entryTurn = game.turn;
            game.log.push(`${teamDisplayName(action.teamIndex)} trocou ${plainName(outgoing.entry.name)} por ${plainName(incoming.entry.name)}.`);
            applyEntryHazards(action.teamIndex, action.switchToIndex);
        });

        // 3. Organização e Ordenação das Ações de Ataque/Movimento
        const moveActions = actions.filter((action) => !Number.isInteger(action.switchToIndex));
        const speedTieBreakers = new Map(moveActions.map((action) => [action, Math.random()]));
        
        moveActions.sort((a, b) => {
            const priorityDifference = (b.move?.priority || 0) - (a.move?.priority || 0);
            if (priorityDifference !== 0) return priorityDifference;
            
            const attackerA = game.teams[a.teamIndex]?.members[a.attackerIndex];
            const attackerB = game.teams[b.teamIndex]?.members[b.attackerIndex];
            if (!attackerA || !attackerB) return 0;
            
            const speedDifference = getBattleStat(attackerB, "speed") - getBattleStat(attackerA, "speed");
            if (speedDifference !== 0) {
                return game.fieldEffects.trickRoomTurns > 0 ? -speedDifference : speedDifference;
            }
            return speedTieBreakers.get(a) - speedTieBreakers.get(b);
        });

        const trickRoomActive = game.fieldEffects.trickRoomTurns > 0;
        game.moveActionOrder = moveActions;

        // 4. Execução Sequencial das Ações de Movimento
        for (let index = 0; index < moveActions.length; index++) {
            const action = moveActions[index];
            const attacker = game.teams[action.teamIndex]?.members[action.attackerIndex];
            if (!attacker) continue;

            game.currentResolution = {
                teamIndex: action.teamIndex,
                attackerIndex: action.attackerIndex,
                pokemonName: attacker.entry.name,
                moveName: action.move.name,
                order: index + 1,
                total: moveActions.length,
                priority: action.move.priority || 0,
                speed: getBattleStat(attacker, "speed"),
                trickRoom: trickRoomActive,
                phase: "ready",
                impactShown: false
            };
            
            clearVisuals();
            renderBattle(true);
            await waitForAnimation(240);
            
            await resolveMoveAction(action);
            
            const hasVisualImpact = game.visualEffects.hitMembers.size > 0 ||
                                    game.visualEffects.itemEffects.size > 0 ||
                                    game.visualEffects.healedMembers.size > 0 ||
                                    game.visualEffects.protectedMembers.size > 0;

            if (!game.currentResolution.impactShown) {
                if (hasVisualImpact) {
                    await showMoveImpact();
                } else {
                    game.currentResolution.phase = "impact";
                    renderBattle(true);
                    await waitForAnimation(450);
                }
            } else if (game.visualEffects.itemEffects.size || game.visualEffects.healedMembers.size) {
                game.currentResolution.phase = "impact";
                renderBattle(true);
                await waitForAnimation(850);
            }
            
            clearVisuals();
            game.currentResolution.phase = "complete";
            renderBattle(true);
            await waitForAnimation(180);
        }

        // 5. Finalização do Turno (Danos residuais, campos e checagem de vitória)
        applyEndTurnStatusDamage();
        
        if (game.visualEffects.hitMembers.size || game.visualEffects.itemEffects.size || game.visualEffects.healedMembers.size) {
            game.currentResolution = null;
            renderBattle(true);
            sendOnlineVisualState();
            await waitForAnimation(850);
            clearVisuals();
        }

        decrementFieldEffects();
        clearFaintedSlots(0);
        clearFaintedSlots(1);
        
        const survivors = game.teams.map((team) => team?.members?.some((member) => member && member.currentHp > 0));
        if (!survivors[0] || !survivors[1]) {
            game.winner = survivors[0] === survivors[1] ? -1 : survivors[0] ? 0 : 1;
            stopBattleMusic();
        } else {
            game.turn++;
        }

        // Reset de estados globais pós-turno
        game.pendingActions = [[], []];
        game.pendingMega.clear();
        game.pendingTarget = null;
        game.currentPlayer = 0;
        game.currentResolution = null;
        renderBattle();
        
        if (onlineMode && onlineRole === 0) sendOnlineBattleState();
    }