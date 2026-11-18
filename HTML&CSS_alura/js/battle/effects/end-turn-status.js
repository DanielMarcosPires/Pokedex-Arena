// Mantemencao da batalha: parte 127 (Organizada e Limpa)

// Processa todos os eventos, danos, curas e decreases de contadores que ocorrem ao final de cada turno de batalha
function applyEndTurnStatusDamage() {
    [0, 1].forEach((teamIndex) => {
        const seen = new Set();
        
        game.active[teamIndex].forEach((memberIndex) => {
            if (memberIndex === null || seen.has(memberIndex)) return;
            seen.add(memberIndex);
            
            const member = game.teams[teamIndex].members[memberIndex];
            if (member.currentHp <= 0) return;

            // 1. Dano por Condições de Status (Burn, Poison, Toxic)
            if (["burn", "poison", "toxic"].includes(member.status?.name)) {
                const damage = member.status.name === "toxic"
                    ? Math.max(1, Math.floor(member.maxHp * member.status.toxicStage / 16))
                    : Math.max(1, Math.floor(member.maxHp / 8));
                    
                recordDamage(teamIndex, memberIndex, damage, "status");
                game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano por ${getAilmentLabel(member.status.name)}.`);
                
                if (member.status.name === "toxic") {
                    member.status.toxicStage = Math.min(15, member.status.toxicStage + 1);
                }
            }

            if (member.currentHp <= 0) return;

            // 2. Dano por Clima (Sandstorm / Hail)
            const types = getMemberTypeNames(member);
            const weather = game.fieldEffects.weather.name;
            
            if ((weather === "sandstorm" && !types.some((type) => ["rock", "ground", "steel"].includes(type))) ||
                (weather === "hail" && !types.includes("ice"))) {
                const damage = Math.max(1, Math.floor(member.maxHp / 16));
                recordDamage(teamIndex, memberIndex, damage, "status");
                game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano pelo clima.`);
            }

            // 3. Cura por Terreno Gramado (Grassy Terrain)
            if (member.currentHp > 0 && game.fieldEffects.terrain.name === "grassy" &&
                game.fieldEffects.terrain.turns > 0 && isGrounded(member)) {
                const healed = healMember(member, member.maxHp / 16);
                if (healed) {
                    game.log.push(`${plainName(member.entry.name)} recuperou ${healed} HP pelo campo gramado.`);
                }
            }

            const effects = member.moveEffects || {};

            // 4. Dano por Aprisionamento (Bind / Wrap, etc.)
            if (member.currentHp > 0 && effects.bindTurns > 0) {
                const damage = Math.max(1, Math.floor(member.maxHp / 8));
                recordDamage(teamIndex, memberIndex, damage, "status");
                game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano enquanto estava preso.`);
            }

            // 5. Octolock (Redução contínua de Defesa e Defesa Especial)
            if (member.currentHp > 0 && effects.octolock) {
                member.statStages.defense = Math.max(-6, (member.statStages.defense || 0) - 1);
                member.statStages["special-defense"] = Math.max(-6, (member.statStages["special-defense"] || 0) - 1);
                game.log.push(`${plainName(member.entry.name)} teve a Defesa e a Defesa Especial reduzidas por Octolock.`);
            }

            // 6. Leech Seed (Drenagem de HP para o usuário das sementes)
            if (member.currentHp > 0 && effects.leechSeed) {
                const damage = Math.max(1, Math.floor(member.maxHp / 8));
                const dealt = recordDamage(teamIndex, memberIndex, damage, "status");
                const source = game.teams[effects.leechSeed.teamIndex].members[effects.leechSeed.memberIndex];
                const healed = healMember(source, dealt);
                
                game.log.push(`${plainName(member.entry.name)} perdeu ${dealt} HP por Leech Seed${
                    healed ? `; ${plainName(source.entry.name)} recuperou ${healed} HP` : ""
                }.`);
            }

            // 7. Nightmare (Dano em Pokémon adormecidos)
            if (member.currentHp > 0 && effects.nightmare && member.status?.name === "sleep") {
                const damage = Math.max(1, Math.floor(member.maxHp / 4));
                recordDamage(teamIndex, memberIndex, damage, "status");
                game.log.push(`${plainName(member.entry.name)} sofreu ${damage} de dano por Nightmare.`);
            }
            if (member.status?.name !== "sleep") {
                effects.nightmare = false;
            }

            // 8. Ingrain e Aqua Ring (Cura contínua)
            if (member.currentHp > 0 && (effects.ingrain || effects.aquaRing)) {
                const healed = healMember(member, member.maxHp / 16);
                if (healed) {
                    game.log.push(`${plainName(member.entry.name)} recuperou ${healed} HP.`);
                }
            }

            // 9. Perish Song (Contagem regressiva de desmaio)
            if (effects.perishTurns > 0) {
                effects.perishTurns--;
                game.log.push(`${plainName(member.entry.name)} tem ${effects.perishTurns} turno(s) restantes de Perish Song.`);
                
                if (effects.perishTurns === 0) {
                    const damage = recordDamage(teamIndex, memberIndex, member.currentHp, "status");
                    if (damage) {
                        game.log.push(`${plainName(member.entry.name)} desmaiou por Perish Song.`);
                    }
                }
            }

            // 10. Yawn (Evolução da sonolência para o sono)
            if (effects.drowsyTurns > 0) {
                effects.drowsyTurns--;
                if (effects.drowsyTurns === 0 && member.currentHp > 0) {
                    const sourceTeamIndex = effects.drowsySourceTeam ?? teamIndex;
                    applyAilment(member, {
                        damage_class: { name: "status" },
                        effect_chance: 100,
                        meta: {
                            ailment: { name: "sleep" },
                            ailment_chance: 100,
                            min_turns: 2,
                            max_turns: 4
                        }
                    }, sourceTeamIndex ?? teamIndex);
                }
            }

            // 11. Decremento de temporizadores de status voláteis
            [
                ["bindTurns", "bindAppliedTurn"],
                ["disableTurns", "disableAppliedTurn"],
                ["encoreTurns", "encoreAppliedTurn"],
                ["tauntTurns", "tauntAppliedTurn"],
                ["healBlockTurns", "healBlockAppliedTurn"],
                ["embargoTurns", "embargoAppliedTurn"],
                ["telekinesisTurns", "telekinesisAppliedTurn"],
                ["throatChopTurns", "throatChopAppliedTurn"]
            ].forEach(([timer, appliedTurn]) => {
                if (effects[timer] > 0) effects[timer]--;
                if (effects[timer] === 0) delete effects[appliedTurn];
            });

            // 12. Efeito de itens segurados ao final do turno (ex: Leftovers, Orbs)
            applyHeldItemEndTurn(teamIndex, memberIndex);
        });
    });

    // 13. Resolução de Desejos (Wishes) programados
    game.fieldEffects.wishes.forEach((teamWishes, teamIndex) => {
        teamWishes.forEach((wish, activeSlot) => {
            if (!wish || wish.dueTurn > game.turn) return;
            teamWishes[activeSlot] = null;
            
            const memberIndex = game.active[teamIndex][activeSlot];
            const member = memberIndex === null ? null : game.teams[teamIndex].members[memberIndex];
            const healed = member && member.currentHp > 0 ? healMember(member, wish.amount) : 0;
            
            game.log.push(healed
                ? `Wish recuperou ${healed} HP de ${plainName(member.entry.name)}.`
                : `Wish de ${teamDisplayName(teamIndex)} não recuperou HP.`
            );
        });
    });

    // 14. Limpeza de turnos de efeitos temporários globais ou específicos de membros
    game.teams.forEach((team) => 
        team.members.forEach((member) => {
            if (member.moveEffects?.destinyBondTurn <= game.turn) {
                member.moveEffects.destinyBondTurn = null;
            }
            if (member.moveEffects?.helpingHandTurn <= game.turn) {
                delete member.moveEffects.helpingHand;
                delete member.moveEffects.helpingHandTurn;
            }
            if (member.moveEffects?.roostRestoreTurn <= game.turn) {
                setMemberTypeNames(member, member.moveEffects.roostOriginalTypes);
                delete member.moveEffects.roostRestoreTurn;
                delete member.moveEffects.roostOriginalTypes;
            }
        })
    );
}