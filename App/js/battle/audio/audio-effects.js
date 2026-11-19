// Mantemencao da batalha: parte 03 a 05 (Organizadas e Limpas)

// 1. Sintetiza e reproduz um tom de áudio (beep) utilizando a Web Audio API com controle de frequência, envelope de volume e forma de onda
function playTone(context, frequency, startAt, duration, waveform, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    // Configura o envelope de ganho (fade-in rápido para evitar cliques e fade-out suave até o término)
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
}


// 2. Reproduz efeitos sonoros programáticos (ataques, impactos, uso de itens e curas) caso o áudio esteja habilitado
function playSoundEffect(effect) {
    if (!soundEffectsEnabled) return;
    
    const context = getAudioContext();
    if (!context || context.state !== "running") return;

    // Padrões de frequências, offsets de tempo, durações e formas de onda para cada efeito sonoro
    const patterns = {
        attack: [
            [220, 0, 0.1, "square"], 
            [440, 0.07, 0.12, "triangle"]
        ],
        hit: [
            [164.81, 0, 0.14, "triangle"], 
            [110, 0.06, 0.12, "sine"]
        ],
        item: [
            [659.25, 0, 0.1, "triangle"], 
            [880, 0.08, 0.16, "sine"]
        ],
        heal: [
            [523.25, 0, 0.14, "sine"], 
            [659.25, 0.11, 0.14, "sine"], 
            [783.99, 0.22, 0.2, "sine"]
        ]
    };

    (patterns[effect] || patterns.item).forEach(([frequency, offset, duration, waveform]) => {
        playTone(context, frequency, context.currentTime + offset, duration, waveform, 0.045);
    });
}


// 3. Interrompe a reprodução da trilha sonora da batalha, reseta o tempo de execução e atualiza os controles da interface
function stopBattleMusic() {
    battleMusicRequest++;
    battleMusic.pause();
    battleMusic.currentTime = 0;
    battleMusicEnabled = false;
    updateBattleAudioControls();
}