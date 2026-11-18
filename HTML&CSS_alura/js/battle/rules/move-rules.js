// Mantemencao da batalha: parte 99 a 102 (Organizadas e Limpas)

// 1. Calcula o poder dinâmico de golpes específicos (Spit Up, Stored Power, Punishment, etc.)
function getMovePower(move, attacker, defender) {
    if (move.name === "spit-up") {
        return 100 * (attacker.moveEffects?.stockpileCount || 0);
    }
    
    if (move.name === "stored-power" || move.name === "power-trip") {
        const boosts = Object.values(attacker.statStages).reduce((sum, stage) =>
            sum + Math.max(0, stage), 0);
        return 20 + boosts * 20;
    }
    
    if (move.name === "punishment") {
        const boosts = Object.values(defender?.statStages || {}).reduce((sum, stage) =>
            sum + Math.max(0, stage), 0);
        return Math.min(200, 60 + boosts * 20);
    }
    
    return move.power || 0;
}


// 2. Extrai e normaliza o texto descritivo dos efeitos de um golpe a partir de suas entradas de dados
function getMoveEffectText(move) {
    const effects = move.effect_entries || [];
    const entry = effects.find(({ language }) => language.name === "en") || effects[0];
    return `${entry?.short_effect || ""} ${entry?.effect || ""}`.toLowerCase();
}


// 3. Verifica se o usuário deve trocar de Pokémon após executar o golpe (U-turn, Volt Switch, etc.)
function userSwitchesAfterMove(move) {
    return SWITCHING_MOVES.has(move.name) ||
        /user (?:must |immediately )?switch(?:es)? out|makes the user switch out|(?:allows|lets) (?:the )?trainer to switch out the user/i
            .test(getMoveEffectText(move));
}


// 4. Verifica se o golpe força a troca do alvo para o banco (Roar, Whirlwind, Dragon Tail, etc.)
function targetIsForcedOut(move) {
    return move.meta?.category?.name === "force-switch" ||
        /forces (?:trainers|the target|the opponent) to switch|forces.{0,80}switch out/i
            .test(getMoveEffectText(move));
}