// Mantemencao da batalha: parte 123 (Organizada e Limpa)

// Aplica condições e status voláteis causados por golpes especiais (como Leech Seed, Taunt, Encore, Substitute, Wish, etc.)
function applyMoveCondition(member, move, sourceTeamIndex, sourceMemberIndex) {
    const effects = member.moveEffects || (member.moveEffects = {});
    const name = move.name;
    const source = game.teams[sourceTeamIndex].members[sourceMemberIndex];
    const memberName = plainName(member.entry.name);
    const sourceName = plainName(source.entry.name);

    // Calcula a duração aleatória em turnos com base nos metadados do golpe
    const turns = (fallback) => {
        const minimum = move.meta?.min_turns || fallback;
        const maximum = move.meta?.max_turns || fallback;
        return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    };

    // Helper para definir temporizadores de turnos e o turno de aplicação
    const setTimer = (key, appliedKey, duration) => {
        effects[key] = duration;
        effects[appliedKey] = game.turn;
    };

    // 1. Modificação de Ordem de Ação (After You / Quash)
    if (name === "after-you" || name === "quash") {
        const targetAction = game.moveActionOrder?.find((action) =>
            action.teamIndex === member.teamIndex &&
            action.attackerIndex === game.teams[member.teamIndex].members.indexOf(member)
        );
        const targetIndex = game.moveActionOrder?.indexOf(targetAction);
        const currentIndex = (game.currentResolution?.order || 1) - 1;

        if (!targetAction || targetIndex <= currentIndex) return false;

        game.moveActionOrder.splice(targetIndex, 1);

        if (name === "after-you") {
            game.moveActionOrder.splice(currentIndex + 1, 0, targetAction);
            game.log.push(`${sourceName} fez ${memberName} agir logo em seguida com After You.`);
        } else {
            game.moveActionOrder.push(targetAction);
            game.log.push(`${sourceName} adiou a ação de ${memberName} com Quash.`);
        }
        return true;
    }

    // 2. Leech Seed (Sementes Sugadoras)
    if (name === "leech-seed") {
        if (getMemberTypeNames(member).includes("grass") || effects.leechSeed) return false;
        effects.leechSeed = { teamIndex: sourceTeamIndex, memberIndex: sourceMemberIndex };
        game.log.push(`${memberName} foi semeado por Leech Seed.`);
        return true;
    }

    // 3. Efeitos de Aprisionamento e Enclausuramento (Bind, Wrap, etc.)
    if (BINDING_MOVES.has(name)) {
        if (effects.bindTurns > 0) return false;
        effects.bindTurns = turns(4);
        effects.bindAppliedTurn = game.turn;
        effects.bindSource = { teamIndex: sourceTeamIndex, memberIndex: sourceMemberIndex };
        game.log.push(`${memberName} ficou preso pelo golpe ${formatName(name)}.`);
        return true;
    }

    // 4. Aprisionamentos Permanentes (Jaw Lock, Octolock)
    if (PERMANENT_TRAP_MOVES.has(name)) {
        if (effects.permanentTrap) return false;
        effects.permanentTrap = true;
        if (name === "jaw-lock") source.moveEffects.permanentTrap = true;
        if (name === "octolock") effects.octolock = true;
        game.log.push(`${memberName} não poderá ser trocado por causa de ${formatName(name)}.`);
        return true;
    }

    // 5. Yawn (Sonolência induzida)
    if (name === "yawn") {
        if (member.status || effects.drowsyTurns > 0 ||
            game.fieldEffects.safeguardTurns[member.teamIndex] > 0 ||
            ["electric", "misty"].includes(game.fieldEffects.terrain.name) &&
            game.fieldEffects.terrain.turns > 0 && isGrounded(member)) {
            return false;
        }
        effects.drowsyTurns = 2;
        effects.drowsyAppliedTurn = game.turn;
        effects.drowsySourceTeam = sourceTeamIndex;
        game.log.push(`${memberName} ficou sonolento por causa de Yawn.`);
        return true;
    }

    // 6. Perish Song (Contagem regressiva de desmaio)
    if (name === "perish-song") {
        if (effects.perishTurns > 0) return false;
        effects.perishTurns = 3;
        effects.perishAppliedTurn = game.turn;
        game.log.push(`${memberName} ouviu Perish Song; restam três turnos.`);
        return true;
    }

    // 7. Nightmare (Pesadelo em Pokémon adormecidos)
    if (name === "nightmare") {
        if (member.status?.name !== "sleep" || effects.nightmare) return false;
        effects.nightmare = true;
        game.log.push(`${memberName} começou a sofrer com Nightmare.`);
        return true;
    }

    // 8. Disable (Bloqueio do último golpe utilizado)
    if (name === "disable") {
        if (!effects.lastMove || effects.disableTurns > 0) return false;
        effects.disabledMove = effects.lastMove;
        setTimer("disableTurns", "disableAppliedTurn", turns(4));
        game.log.push(`${sourceName} bloqueou ${formatName(effects.disabledMove)} de ${memberName} com Disable.`);
        return true;
    }

    // 9. Encore (Repetição forçada do último golpe)
    if (name === "encore") {
        if (!effects.lastMove || effects.encoreTurns > 0) return false;
        effects.encoreMove = effects.lastMove;
        setTimer("encoreTurns", "encoreAppliedTurn", turns(3));
        game.log.push(`${memberName} foi forçado a repetir ${formatName(effects.encoreMove)} por Encore.`);
        return true;
    }

    // 10. Taunt (Provocação - bloqueia golpes de status)
    if (name === "taunt") {
        if (effects.tauntTurns > 0) return false;
        setTimer("tauntTurns", "tauntAppliedTurn", turns(3));
        game.log.push(`${memberName} foi provocado por Taunt.`);
        return true;
    }

    // 11. Torment (Impede usar o mesmo golpe consecutivamente)
    if (name === "torment") {
        if (effects.torment) return false;
        effects.torment = true;
        game.log.push(`${memberName} foi afetado por Torment.`);
        return true;
    }

    // 12. Attract (Infatuação / Atração)
    if (name === "attract") {
        if (effects.infatuated || member.teamIndex === sourceTeamIndex) return false;
        effects.infatuated = true;
        game.log.push(`${memberName} ficou apaixonado por ${sourceName}.`);
        return true;
    }

    // 13. Ingrain / Aqua Ring (Recuperação contínua de HP)
    if (name === "ingrain" || name === "aqua-ring") {
        const key = name === "ingrain" ? "ingrain" : "aquaRing";
        if (effects[key]) return false;
        effects[key] = true;
        game.log.push(`${sourceName} criou ${name === "ingrain" ? "raízes com Ingrain" : "um anel de água com Aqua Ring"}.`);
        return true;
    }

    // 14. Heal Block / Embargo / Telekinesis / Smack Down / Tar Shot
    if (name === "heal-block") {
        if (effects.healBlockTurns > 0) return false;
        setTimer("healBlockTurns", "healBlockAppliedTurn", turns(5));
        game.log.push(`${memberName} não poderá recuperar HP por alguns turnos devido a Heal Block.`);
        return true;
    }
    if (name === "embargo") {
        if (effects.embargoTurns > 0) return false;
        setTimer("embargoTurns", "embargoAppliedTurn", turns(5));
        game.log.push(`${memberName} foi afetado por Embargo; itens não são usados nesta batalha.`);
        return true;
    }
    if (name === "telekinesis") {
        if (effects.telekinesisTurns > 0 || effects.grounded) return false;
        setTimer("telekinesisTurns", "telekinesisAppliedTurn", 3);
        game.log.push(`${memberName} foi suspenso no ar por Telekinesis.`);
        return true;
    }
    if (name === "smack-down") {
        if (effects.grounded) return false;
        effects.grounded = true;
        effects.telekinesisTurns = 0;
        game.log.push(`${memberName} foi derrubado no chão por Smack Down.`);
        return true;
    }
    if (name === "tar-shot") {
        if (effects.tarShot) return false;
        effects.tarShot = true;
        game.log.push(`${memberName} ficou coberto de alcatrão e vulnerável a golpes de fogo.`);
        return true;
    }
    if (name === "throat-chop") {
        setTimer("throatChopTurns", "throatChopAppliedTurn", 2);
        game.log.push(`${memberName} não poderá usar golpes sonoros por dois turnos.`);
        return true;
    }

    // 15. Alterações de vulnerabilidade (Foresight, Odor Sleuth, Miracle Eye)
    if (name === "foresight" || name === "odor-sleuth") {
        if (effects.foresight) return false;
        effects.foresight = true;
        game.log.push(`${memberName} não poderá mais se esquivar de golpes Normal ou Lutador.`);
        return true;
    }
    if (name === "miracle-eye") {
        if (effects.miracleEye) return false;
        effects.miracleEye = true;
        game.log.push(`${memberName} ficou vulnerável a golpes Psíquicos.`);
        return true;
    }

    // 16. Efeitos utilitários e reflexões (Destiny Bond, Helping Hand, Magic Coat, Wish)
    if (name === "destiny-bond") {
        effects.destinyBondTurn = game.turn;
        game.log.push(`${sourceName} criou um vínculo de Destiny Bond.`);
        return true;
    }
    if (name === "helping-hand") {
        if (effects.helpingHand) return false;
        effects.helpingHand = true;
        effects.helpingHandTurn = game.turn;
        game.log.push(`${memberName} recebeu o apoio de Helping Hand.`);
        return true;
    }
    if (name === "magic-coat") {
        effects.magicCoatTurn = game.turn;
        game.log.push(`${sourceName} preparou Magic Coat para refletir golpes de status.`);
        return true;
    }
    if (name === "wish") {
        const activeSlot = game.active[sourceTeamIndex].indexOf(sourceMemberIndex);
        if (activeSlot < 0 || game.fieldEffects.wishes[sourceTeamIndex][activeSlot]) return false;
        
        game.fieldEffects.wishes[sourceTeamIndex][activeSlot] = {
            amount: Math.floor(source.maxHp / 2),
            appliedTurn: game.turn,
            dueTurn: game.turn + 1
        };
        game.log.push(`${sourceName} fez um desejo que será atendido no próximo turno.`);
        return true;
    }

    // 17. Cura e autocura (Rest, Refresh, Psycho Shift)
    if (name === "rest") {
        if (effects.healBlockTurns > 0 || (member.currentHp === member.maxHp && !member.status)) return false;
        member.currentHp = member.maxHp;
        member.status = { name: "sleep", turnsRemaining: 3, toxicStage: 0 };
        game.log.push(`${memberName} recuperou todo o HP e adormeceu com Rest.`);
        consumeLumBerry(member);
        return true;
    }
    if (name === "refresh") {
        if (!["burn", "paralysis", "poison", "toxic"].includes(member.status?.name)) return false;
        member.status = null;
        game.log.push(`${memberName} curou sua condição de status com Refresh.`);
        return true;
    }
    if (name === "psycho-shift") {
        if (!source.status || member.status) return false;
        const types = getMemberTypeNames(member);
        const immuneTypes = {
            burn: ["fire"],
            paralysis: ["electric"],
            poison: ["poison", "steel"],
            toxic: ["poison", "steel"],
            freeze: ["ice"]
        }[source.status.name] || [];

        if (immuneTypes.some((type) => types.includes(type)) ||
            game.fieldEffects.safeguardTurns[member.teamIndex] > 0 ||
            ["electric", "misty"].includes(game.fieldEffects.terrain.name) &&
            game.fieldEffects.terrain.turns > 0 && isGrounded(member)) {
            return false;
        }

        member.status = source.status;
        source.status = null;
        game.log.push(`${sourceName} transferiu sua condição de status para ${memberName}.`);
        consumeLumBerry(member);
        return true;
    }

    // 18. Tri Attack (Chance de status aleatório)
    if (name === "tri-attack") {
        if (member.status || Math.random() >= 0.2) return false;
        const ailment = ["burn", "paralysis", "freeze"][Math.floor(Math.random() * 3)];
        return applyAilment(member, {
            ...move,
            effect_chance: 100,
            meta: { ...move.meta, ailment: { name: ailment }, ailment_chance: 100 }
        }, sourceTeamIndex);
    }

    // 19. Substitute (Criação de boneco de substituição)
    if (name === "substitute") {
        if (member !== source || member.currentHp <= Math.floor(member.maxHp / 4)) return false;
        effects.substituteHp = Math.floor(member.maxHp / 4);
        recordDamage(sourceTeamIndex, sourceMemberIndex, effects.substituteHp);
        game.log.push(`${sourceName} criou um Substitute que pode absorver ${effects.substituteHp} de dano.`);
        return true;
    }

    // 20. Transform (Transformação em outro Pokémon)
    if (name === "transform") {
        if (source === member || source.moveEffects.transformed) return false;
        source.transformedStats = Object.fromEntries(
            ["attack", "defense", "special-attack", "special-defense", "speed"]
                .map((stat) => [stat, statValue(member.pokemon, stat)])
        );
        source.moves = [...member.moves];
        source.statStages = { ...member.statStages };
        setMemberTypeNames(source, getMemberTypeNames(member));
        source.moveEffects.transformed = true;
        game.log.push(`${sourceName} se transformou em ${memberName}.`);
        return true;
    }

    // 21. Mimic / Sketch (Cópia permanente ou temporária de golpes)
    if (name === "mimic" || name === "sketch") {
        const lastMove = effects.lastMove;
        const copiedMove = member.moves.find(({ name: moveName }) => moveName === lastMove);
        const slot = source.moves.findIndex(({ name: moveName }) => moveName === name);

        if (!copiedMove || slot < 0 || lastMove === "mimic" || lastMove === "sketch") return false;
        source.moves[slot] = copiedMove;
        if (name === "sketch") source.originalMoves[slot] = copiedMove;
        
        game.log.push(`${sourceName} copiou ${formatName(lastMove)} com ${formatName(name)}.`);
        return true;
    }

    // 22. Aromatherapy / Heal Bell (Cura de status de equipe)
    if (name === "aromatherapy" || name === "heal-bell") {
        const team = game.teams[sourceTeamIndex];
        let cured = false;

        team.members.forEach((ally) => {
            if (ally.status || ally.confusionTurns > 0) {
                ally.status = null;
                ally.confusionTurns = 0;
                cured = true;
            }
        });

        if (cured) {
            game.log.push(`${sourceName} curou as condições de status da equipe com ${formatName(name)}.`);
        }
        return cured;
    }

    return false;
}