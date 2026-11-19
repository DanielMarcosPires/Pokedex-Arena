const AILMENT_LABELS = {
    burn: "queimadura",
    paralysis: "paralisia",
    poison: "envenenamento",
    toxic: "envenenamento grave",
    sleep: "sono",
    freeze: "congelamento",
    confusion: "confusão"
};

function getAilmentLabel(ailment) {
    return AILMENT_LABELS[ailment] || ailment || "condição de status";
}