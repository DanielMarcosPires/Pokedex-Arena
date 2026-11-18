// Mantemencao da batalha: parte 133 e 134 (Organizadas e Limpas)

// 1. Limpa e define como nulos os slots ativos em campo cujos Pokémon tenham HP menor ou igual a zero (desmaiados)
function clearFaintedSlots(teamIndex) {
    const team = game.teams[teamIndex];
    const active = game.active[teamIndex];
    
    active.forEach((memberIndex, activeSlot) => {
        if (memberIndex === null || team.members[memberIndex].currentHp > 0) return;
        active[activeSlot] = null;
    });
}


// 2. Executa a Mega Evolução de um Pokémon em campo, validando a pedra de item segurado (Mega Stone) e atualizando atributos e tipos
function megaEvolveMember(teamIndex, memberIndex) {
    const member = game.teams[teamIndex].members[memberIndex];

    // Valida se o Pokémon possui forma Mega, item compatível, se a Mega Evolução do time já foi usada e se a Mega Stone corresponde
    if (!member.megaPokemon || !member.heldItem || game.megaUsed[teamIndex] ||
        MEGA_STONES[member.heldItem] !== member.megaPokemon.name) {
        return false;
    }

    member.pokemon = member.megaPokemon;
    member.megaEvolved = true;
    member.megaTypes = member.pokemon.types.map(({ type }) => type.name);
    
    setMemberTypeNames(member, member.megaTypes);
    
    // Consome o item segurado (Mega Stone) ao realizar a Mega Evolução
    member.heldItem = null;
    game.megaUsed[teamIndex] = true;
    
    game.visualEffects.megaEvolved.add(`${teamIndex}:${memberIndex}`);
    game.log.push(`${plainName(member.entry.name)} Mega Evoluiu para ${plainName(member.pokemon.name)}!`);
    
    return true;
}