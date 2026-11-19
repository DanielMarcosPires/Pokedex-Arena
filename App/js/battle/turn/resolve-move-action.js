// Mantemencao da batalha: parte 132 (Organizada e Blindada)
async function resolveMoveAction(action) {
    const attacker = game.teams[action.teamIndex]?.members[action.attackerIndex];
    if (!attacker || attacker.currentHp <= 0) return;

    let move = action.move;
    let moveName = plainName(move.name);
    const attackerName = plainName(attacker.entry.name);

    // 1. Validações Iniciais de Turno e Restrições
    if (game.active[action.teamIndex]?.[action.activeSlot] !== action.attackerIndex) {
        game.log.push(`${attackerName} foi trocado antes de usar ${moveName}.`);
        return;
    }

    if (!canMemberAct(attacker, action.teamIndex, action.attackerIndex)) return;

    const restriction = moveRestriction(attacker, move);
    if (restriction) {
        game.log.push(`${attackerName} não conseguiu usar ${moveName}. ${restriction}`);
        return;
    }

    attacker.moveEffects = attacker.moveEffects || {};

    // 2. Golpes de Cópia e Aleatórios (Copycat, Mirror Move, Metronome)
    if (["copycat", "mirror-move", "metronome"].includes(move.name)) {
        const previous = game.lastExecutedMove;
        const expectedTeam = action.targetTeamIndex;
        const excludedMoves = ["copycat", "mirror-move", "metronome", "mimic", "sketch", "struggle"];

        const availableMoves = game.teams
            .flatMap((team) => team.members.flatMap((member) => member.moves))
            .filter((candidate) => !excludedMoves.includes(candidate.name));

        const copiedMove = move.name === "metronome"
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : previous?.move;

        const isInvalidCopy = !copiedMove || (move.name !== "metronome" && (
            (move.name === "mirror-move" && previous?.teamIndex !== expectedTeam) ||
            ["copycat", "mirror-move", "struggle"].includes(copiedMove.name)
        ));

        if (isInvalidCopy) {
            game.log.push(`${attackerName} tentou usar ${moveName}, mas não havia um golpe válido para copiar.`);
            return;
        }

        move = copiedMove;
        action = { ...action, move };
        moveName = plainName(move.name);
    }

    // 3. Registro de Histórico do Golpe e Animação de Ataque
    attacker.moveEffects.previousMoveType = attacker.moveEffects.lastMoveType;
    attacker.moveEffects.lastMove = move.name;
    attacker.moveEffects.lastMoveType = move.type?.name || null;
    game.lastExecutedMove = { move, teamIndex: action.teamIndex, attackerIndex: action.attackerIndex };

    if (action.targetUnavailable) {
        game.log.push(`${attackerName} tentou usar ${moveName}, mas não havia um aliado válido para receber o golpe.`);
        return;
    }

    // Só adiciona a animação de avanço (attacker) se NÃO for um movimento de proteção ou endure
    const isProtectionMove = PERSONAL_PROTECTION_MOVES?.has(move.name) || move.name === "endure";
    if (!isProtectionMove) {
        game.visualEffects?.attackers?.add(`${action.teamIndex}:${action.attackerIndex}`);
    } else {
        game.visualEffects?.protectedMembers?.add(`${action.teamIndex}:${action.attackerIndex}`);
    }
    playSoundEffect("attack");

    if (game.currentResolution) {
        game.currentResolution.phase = "attacking";
        renderBattle(true);
        sendOnlineVisualState();
        await waitForAnimation(550);
    }

    // 4. Pré-condições Específicas de Golpes e Efeitos Imediatos
    if (move.name === "shed-tail" && attacker.currentHp <= Math.floor(attacker.maxHp / 2)) {
        game.log.push(`${attackerName} tentou usar Shed Tail, mas não tinha HP suficiente.`);
        return;
    }
    if ((move.name === "burn-up" && !getMemberTypeNames(attacker).includes("fire"))
        || (move.name === "double-shock" && !getMemberTypeNames(attacker).includes("electric"))) {
        game.log.push(`${attackerName} tentou usar ${moveName}, mas não tinha a tipagem necessária.`);
        return;
    }
    if (move.name === "spit-up" && !(attacker.moveEffects.stockpileCount > 0)) {
        game.log.push(`${attackerName} tentou usar Spit Up sem energia acumulada por Stockpile.`);
        return;
    }

    if (PROTECTION_MOVES.has(move.name)) {
        activateProtection(action, move);
        return;
    }
    if (move.name === "focus-energy") {
        attacker.criticalStage = 2;
        game.log.push(`${attackerName} concentrou sua energia para aumentar os acertos críticos.`);
        return;
    }
    if (["defog", "court-change", "tidy-up"].includes(move.name)) {
        applyFieldUtilityMove(action, move);
        return;
    }

    // 5. Resolução de Alvos ou Efeitos de Campo
    const targets = getMoveTargets(action);
    if (!targets.length) {
        if (!applyFieldMove(action, move)) {
            game.log.push(`${attackerName} usou ${moveName}; efeitos de campo não são simulados.`);
        }
        if (userSwitchesAfterMove(move) && getAvailableSwitches(action.teamIndex).length) {
            await showMoveImpact();
            await new Promise((resolve) => openSwitchPicker(
                action.teamIndex, action.activeSlot, true, move.name, resolve
            ));
        } else if (userSwitchesAfterMove(move)) {
            game.log.push(`${attackerName} não tinha reserva para entrar após ${moveName}.`);
        }
        return;
    }

    // 6. Preparação de Variáveis de Dano e Efeitos
    const effectText = getMoveEffectText(move);
    const fixedDamage = getFixedDamage(move, attacker, targets[0].member);

    if (["counter", "mirror-coat", "metal-burst"].includes(move.name) && fixedDamage === null) {
        game.log.push(`${attackerName} usou ${moveName}, mas não sofreu o tipo de dano necessário para revidar.`);
        return;
    }

    const damageMove = move.damage_class?.name !== "status"
        && (getMovePower(move, attacker, targets[0].member) > 0 || fixedDamage !== null);
    const changesUserStats = move.name !== "stockpile" && moveChangesUserStats(move);

    let successful = false;
    let userStatsApplied = false;
    let totalDamage = 0;
    let totalHitDamage = 0;

    // 7. Iteração por Alvo
    for (const target of targets) {
        const targetMember = target?.member;
        if (!targetMember || targetMember.currentHp <= 0) continue;

        const targetName = plainName(targetMember.entry.name);

        // Checagem de Proteção e Precisão
        if (protectionBlocksMove(action, target)) {
            game.log.push(`${targetName} bloqueou ${moveName} com proteção.`);
            successful = true;
            continue;
        }

        const accuracy = getMoveAccuracy(move, attacker, targetMember);
        if (accuracy && Math.random() * 100 >= accuracy) {
            game.log.push(`${attackerName} usou ${moveName}, mas errou contra ${targetName}.`);
            continue;
        }

        // Reflexão com Magic Coat
        if (move.damage_class?.name === "status"
            && target.teamIndex !== action.teamIndex
            && targetMember.moveEffects?.magicCoatTurn === game.turn) {
            let reflected = false;
            if (TYPE_MOVE_NAMES.has(move.name)) {
                reflected = applyTypeMoveEffect(attacker, targetMember, move);
            } else if (STAT_EFFECT_MOVE_NAMES.has(move.name)) {
                reflected = applyStatMoveEffect(attacker, targetMember, move);
            } else if (MOVE_CONDITION_NAMES.has(move.name)) {
                reflected = applyMoveCondition(attacker, move, target.teamIndex, target.memberIndex);
            } else {
                reflected = applyAilment(attacker, move, target.teamIndex);
            }
            successful = applyStatChanges(attacker, move, target.teamIndex) || reflected || successful;
            game.log.push(`${targetName} refletiu ${moveName} com Magic Coat.`);
            continue;
        }

        // Efetividade de Tipo e Substitute
        const moveType = getEffectiveMoveType(move);
        const effectiveness = damageMove ? typeEffectiveness(moveType, targetMember) : 1;

        if (damageMove && effectiveness === 0) {
            game.log.push(`${attackerName} usou ${moveName} em ${targetName}, mas não afetou o alvo.`);
            continue;
        }

        const substitute = targetMember.moveEffects?.substituteHp > 0 && target.teamIndex !== action.teamIndex;
        if (substitute && !damageMove) {
            game.log.push(`${targetName} foi protegido por Substitute contra ${moveName}.`);
            successful = true;
            continue;
        }

        // Casos Especiais de Cura/Divisão de HP
        if (move.name === "pollen-puff" && target.teamIndex === action.teamIndex) {
            const healed = healMember(targetMember, targetMember.maxHp / 2);
            game.log.push(healed
                ? `${attackerName} usou ${moveName} e recuperou ${healed} HP de ${targetName}.`
                : `${attackerName} usou ${moveName}, mas ${targetName} já estava com HP cheio.`);
            successful = healed > 0;
            continue;
        }

        if (move.name === "pain-split") {
            const sharedHp = Math.floor((attacker.currentHp + targetMember.currentHp) / 2);
            const attackerHp = Math.min(attacker.maxHp, sharedHp);
            const targetHp = Math.min(targetMember.maxHp, sharedHp);

            if (attacker.currentHp > attackerHp) {
                recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp - attackerHp);
            } else {
                healMember(attacker, attackerHp - attacker.currentHp);
            }

            if (targetMember.currentHp > targetHp) {
                recordDamage(target.teamIndex, target.memberIndex, targetMember.currentHp - targetHp);
            } else {
                healMember(targetMember, targetHp - targetMember.currentHp);
            }

            game.log.push(`${attackerName} usou Pain Split; ambos ficaram com até ${sharedHp} HP.`);
            successful = true;
            continue;
        }

        // Cálculo e Aplicação de Dano Direto
        if (damageMove) {
            if (move.name === "endeavor" && fixedDamage === 0) {
                game.log.push(`${attackerName} usou Endeavor, mas o alvo não tinha mais HP que ele.`);
                continue;
            }

            const hitCount = fixedDamage === null ? getHitCount(move) : 1;
            const hitResults = fixedDamage === null
                ? Array.from({ length: hitCount }, () => calculateDamage(
                    attacker, targetMember, move, effectiveness, moveType
                ))
                : [];

            let damage = fixedDamage === null
                ? hitResults.reduce((sum, hit) => sum + hit.amount, 0)
                : fixedDamage;

            if (move.meta?.category?.name === "ohko") damage = targetMember.currentHp;

            const endured = !substitute && targetMember.enduredTurn === game.turn && damage >= targetMember.currentHp;
            if (endured) damage = Math.max(0, targetMember.currentHp - 1);

            const sashActivated = !substitute && !endured
                && targetMember.heldItem === "focus_sash"
                && targetMember.currentHp === targetMember.maxHp
                && damage >= targetMember.currentHp;

            if (sashActivated) {
                damage = Math.max(0, targetMember.currentHp - 1);
                targetMember.heldItem = null;
                recordItemEffect(target.teamIndex, target.memberIndex, "defense", "Focus Sash · resistiu");
            }

            let dealt = 0;
            let substituteAbsorbed = 0;

            if (substitute) {
                substituteAbsorbed = Math.min(targetMember.moveEffects.substituteHp, damage);
                targetMember.moveEffects.substituteHp -= substituteAbsorbed;
                game.log.push(`O Substitute de ${targetName} absorveu ${substituteAbsorbed} de dano${targetMember.moveEffects.substituteHp ? ` (${targetMember.moveEffects.substituteHp} restantes)` : "; foi destruído"}.`);
                successful = substituteAbsorbed > 0 || successful;
            } else {
                dealt = recordDamage(target.teamIndex, target.memberIndex, damage);
            }

            totalHitDamage += dealt + substituteAbsorbed;
            totalDamage += dealt;
            successful = dealt > 0 || successful;

            if (dealt > 0) {
                targetMember.damageTakenThisTurn = dealt;
                targetMember.lastDamageClassThisTurn = move.damage_class?.name;
                const itemMultiplier = getHeldItemDamageMultiplier(attacker, move, moveType, effectiveness);
                if (itemMultiplier > 1) {
                    const itemName = formatName(attacker.heldItem.replace(/_/g, "-"));
                    recordItemEffect(action.teamIndex, action.attackerIndex, "boost", `${itemName} · dano aumentado`);
                }
            }

            // Construção da Mensagem de Combate
            let message = substitute
                ? `${attackerName} usou ${moveName} em ${targetName}, mas o dano foi absorvido pelo Substitute.`
                : `${attackerName} usou ${moveName} em ${targetName} e causou ${dealt} de dano.`;
            if (endured) message += ` ${targetName} resistiu com 1 HP graças a Endure.`;
            if (hitResults.some(({ critical }) => critical)) message += " Acerto crítico!";
            if (hitCount > 1) message += ` Acertou ${hitCount} vezes.`;
            if (sashActivated) message += ` Focus Sash permitiu que ${targetName} resistisse com 1 HP.`;
            if (effectiveness > 1) message += " Foi super efetivo!";
            else if (effectiveness < 1) message += " Não foi muito efetivo.";
            game.log.push(message);

            // Reações de Itens e Nocaute
            if (dealt > 0 && effectiveness > 1 && targetMember.heldItem === "weakness_policy") {
                targetMember.statStages.attack = Math.min(6, (targetMember.statStages.attack || 0) + 2);
                targetMember.statStages["special-attack"] = Math.min(6, (targetMember.statStages["special-attack"] || 0) + 2);
                targetMember.heldItem = null;
                game.log.push(`${targetName} ativou Weakness Policy e aumentou Ataque e Ataque Especial.`);
                recordItemEffect(target.teamIndex, target.memberIndex, "boost", "Weakness Policy · ataque aumentado");
            }

            if (dealt > 0 && move.flags?.some(({ name }) => name === "contact")
                && targetMember.heldItem === "rocky_helmet" && attacker.currentHp > 0) {
                const recoil = Math.max(1, Math.floor(attacker.maxHp / 6));
                const helmetDamage = recordDamage(action.teamIndex, action.attackerIndex, recoil);
                game.log.push(`Rocky Helmet causou ${helmetDamage} de dano a ${attackerName}.`);
                if (helmetDamage) {
                    recordItemEffect(action.teamIndex, action.attackerIndex, "damage", `Rocky Helmet · -${helmetDamage} HP`);
                }
                if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo Rocky Helmet.`);
            }

            if (targetMember.currentHp === 0) {
                game.log.push(`${targetName} foi derrotado.`);
                if (targetMember.moveEffects?.destinyBondTurn === game.turn
                    && target.teamIndex !== action.teamIndex && attacker.currentHp > 0) {
                    recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp);
                    game.log.push(`${attackerName} também desmaiou por Destiny Bond.`);
                }
            }
        }

        if (substitute) continue;

        // Aplicação de Efeitos Secundários e Status no Alvo
        if (changesUserStats
            && target.teamIndex === action.teamIndex
            && target.memberIndex === action.attackerIndex
            && !userStatsApplied) {
            successful = applyStatChanges(attacker, move, action.teamIndex) || successful;
            userStatsApplied = true;
        }

        if (targetMember.currentHp > 0) {
            if (move.name === "strength-sap") {
                const healed = healMember(attacker, getBattleStat(targetMember, "attack"));
                if (healed) {
                    game.log.push(`${attackerName} recuperou ${healed} HP com Strength Sap.`);
                    successful = true;
                }
            }

            if (STAT_EFFECT_MOVE_NAMES.has(move.name)) {
                successful = applyStatMoveEffect(attacker, targetMember, move) || successful;
            } else if (!changesUserStats && move.name !== "stockpile") {
                successful = applyStatChanges(targetMember, move, action.teamIndex) || successful;
            }

            if (TYPE_MOVE_NAMES.has(move.name)) {
                successful = applyTypeMoveEffect(attacker, targetMember, move) || successful;
            } else if (MOVE_CONDITION_NAMES.has(move.name) || move.meta?.ailment?.name === "trap") {
                successful = applyMoveCondition(targetMember, move, action.teamIndex, action.attackerIndex) || successful;
            } else {
                successful = applyAilment(targetMember, move, action.teamIndex) || successful;
            }

            const flinchChance = Number(move.meta?.flinch_chance) || 0;
            if (flinchChance && Math.random() * 100 < flinchChance) {
                targetMember.flinchedTurn = game.turn;
                game.log.push(`${targetName} recuou.`);
                successful = true;
            }

            if (move.meta?.healing > 0 && move.name !== "swallow") {
                const healed = healMember(targetMember, targetMember.maxHp * move.meta.healing / 100);
                if (healed) {
                    game.log.push(`${targetName} recuperou ${healed} HP.`);
                    successful = true;
                }
            }

            if (targetIsForcedOut(move) && game.teams[target.teamIndex]?.members[target.memberIndex]?.currentHp > 0) {
                await showMoveImpact();
                successful = await forceSwitchTarget(target, move.name) || successful;
            }
        }
    }

    // 8. Efeitos Pós-Ação no Atacante (Dreno, Recuo, Itens e Trocas)
    if (changesUserStats && !userStatsApplied && successful) {
        successful = applyStatChanges(attacker, move, action.teamIndex) || successful;
    }

    if (successful && ["burn-up", "double-shock"].includes(move.name)) {
        const removedType = move.name === "burn-up" ? "fire" : "electric";
        setMemberTypeNames(attacker, getMemberTypeNames(attacker).filter((type) => type !== removedType));
        game.log.push(`${attackerName} perdeu o tipo ${typeLabel(removedType)} após ${moveName}.`);
    }

    if (move.name === "spit-up") releaseStockpile(attacker);

    if (move.name === "rapid-spin" && successful) {
        clearHazards(action.teamIndex);
        attacker.moveEffects.bindTurns = 0;
        game.log.push(`${attackerName} removeu armadilhas e escapou de golpes que o prendiam com Rapid Spin.`);
    }

    if (damageMove && attacker.moveEffects.helpingHand) delete attacker.moveEffects.helpingHand;
    if (userSwitchesAfterMove(move) && move.damage_class?.name === "status") successful = true;

    if (move.name === "shed-tail") {
        const cost = Math.floor(attacker.maxHp / 2);
        recordDamage(action.teamIndex, action.attackerIndex, cost);
        game.log.push(`${attackerName} perdeu ${cost} HP ao usar Shed Tail.`);
    }

    if (move.meta?.drain > 0 && totalDamage > 0) {
        const healed = healMember(attacker, totalDamage * move.meta.drain / 100);
        if (healed) game.log.push(`${attackerName} recuperou ${healed} HP com ${moveName}.`);
    } else if (move.meta?.drain < 0 && totalDamage > 0) {
        const recoil = Math.max(1, Math.floor(totalDamage * Math.abs(move.meta.drain) / 100));
        const received = recordDamage(action.teamIndex, action.attackerIndex, recoil);
        game.log.push(`${attackerName} recebeu ${received} de dano de recuo.`);
        if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo recuo.`);
    }

    if (totalHitDamage > 0 && attacker.currentHp > 0 && attacker.heldItem === "shell_bell") {
        const healed = healWithHeldItem(action.teamIndex, action.attackerIndex, totalHitDamage / 8, "Shell Bell");
        if (healed) game.log.push(`${attackerName} recuperou ${healed} HP com Shell Bell.`);
    }

    if (totalHitDamage > 0 && attacker.currentHp > 0 && attacker.heldItem === "life_orb") {
        const recoil = Math.max(1, Math.floor(attacker.maxHp / 10));
        const received = recordDamage(action.teamIndex, action.attackerIndex, recoil);
        game.log.push(`${attackerName} perdeu ${received} HP pelo recuo de Life Orb.`);
        if (received) recordItemEffect(action.teamIndex, action.attackerIndex, "damage", `Life Orb · -${received} HP`);
        if (attacker.currentHp === 0) game.log.push(`${attackerName} foi derrotado pelo recuo de Life Orb.`);
    }

    if (/user faints\b|causes the user to faint|user faints upon/i.test(effectText) && attacker.currentHp > 0) {
        const received = recordDamage(action.teamIndex, action.attackerIndex, attacker.currentHp);
        if (received) game.log.push(`${attackerName} desmaiou após usar ${moveName}.`);
    }

    if (userSwitchesAfterMove(move) && successful && attacker.currentHp > 0) {
        if (getAvailableSwitches(action.teamIndex).length) {
            await showMoveImpact();
            await new Promise((resolve) => openSwitchPicker(
                action.teamIndex, action.activeSlot, true, move.name, resolve
            ));
        } else {
            game.log.push(`${attackerName} não tinha reserva para entrar após ${moveName}.`);
        }
    }

    // 9. Registro Final de Falha ou Efeito Não Suportado
    const hasSupportedEffect = Boolean(
        move.power || fixedDamage !== null || move.stat_changes?.length
        || (move.meta?.ailment?.name && move.meta.ailment.name !== "none")
        || move.meta?.healing || move.meta?.drain
        || targetIsForcedOut(move) || userSwitchesAfterMove(move)
        || MOVE_CONDITION_NAMES.has(move.name)
        || TYPE_MOVE_NAMES.has(move.name)
        || STAT_EFFECT_MOVE_NAMES.has(move.name)
        || ["aromatherapy", "heal-bell", "defog", "court-change", "tidy-up", "wish", "counter",
            "mirror-coat", "metal-burst", "pain-split", "final-gambit", "endeavor", "spit-up"].includes(move.name)
    );

    if (!successful && move.damage_class?.name === "status" && hasSupportedEffect) {
        game.log.push(`${attackerName} usou ${moveName}, mas o efeito falhou.`);
    } else if (!hasSupportedEffect) {
        game.log.push(`${attackerName} usou ${moveName}, mas seu efeito especial não é simulado.`);
    }
}