// Mantemencao da batalha: parte 122 (Organizada e Limpa)

// Reseta os bônus de status (Defesa e Defesa Especial) acumulados pelo uso de Stockpile e limpa os contadores do Pokémon
function releaseStockpile(member) {
    const effects = member.moveEffects || {};
    const boosts = effects.stockpileDefenseBoosts || {};

    // Reverte os estágios de Defesa e Defesa Especial concedidos pelos acúmulos, respeitando o limite mínimo de -6
    member.statStages.defense = Math.max(
        -6, 
        (member.statStages.defense || 0) - (boosts.defense || 0)
    );
    
    member.statStages["special-defense"] = Math.max(
        -6, 
        (member.statStages["special-defense"] || 0) - (boosts.specialDefense || 0)
    );

    // Reseta o contador de acúmulos e os bônus armazenados
    effects.stockpileCount = 0;
    effects.stockpileDefenseBoosts = {};
}