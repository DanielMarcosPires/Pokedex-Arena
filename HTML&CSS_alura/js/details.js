window.PokedexApp.details = (() => {
    const { config, dom, api } = window.PokedexApp;
    const { statNames, typeNames } = config;
    const { detailContent, dialog } = dom;
    const { escapeHTML, formatName, generationFor, imageUrl, statTotal, typeLabel } = window.PokedexApp.utils;
    const moveMethodLabels = {
        "level-up": "Nível",
        machine: "TM/HM",
        egg: "Ovo",
        tutor: "Tutor",
        "stadium-surfing-pikachu": "Surf do Pikachu",
        "light-ball-egg": "Ovo (Bola Luminosa)",
        "colosseum-purification": "Purificação (Colosseum)",
        "xd-purification": "Purificação (XD)",
        "form-change": "Mudança de forma",
        "stadium-copied": "Cópia (Stadium)"
    };
    const moveMethodClasses = {
        "level-up": "move-method-level",
        machine: "move-method-machine",
        egg: "move-method-egg"
    };

    function competitiveRole(stats) {
        const values = Object.fromEntries(stats.map(({ stat, base_stat }) => [stat.name, base_stat]));
        const offense = Math.max(values.attack, values["special-attack"]);
        const defense = Math.max(values.defense, values["special-defense"]);
        if (values.speed >= 100 && offense >= 100) return "Atacante rápido";
        if (values.speed <= 50 && values.hp >= 90 && defense >= 100) return "Tanque resistente";
        if (offense >= 115) return values.attack >= values["special-attack"] ? "Atacante físico" : "Atacante especial";
        if (defense >= 110 && values.hp >= 80) return "Defensor";
        if (values.speed >= 90) return "Ágil / suporte";
        return "Versátil";
    }

    function matchupMarkup(type, kind) {
        const label = kind === "neutral" ? `${typeLabel(type)} · imune` : typeLabel(type);
        return `<span class="matchup-chip ${kind} type-${escapeHTML(type)}">${label}</span>`;
    }

    function getMatchups(typeData) {
        const defendingTypes = typeData.map(({ damage_relations }) => damage_relations);
        const weak = new Map();
        const resist = new Map();
        const immune = new Set();
        Object.keys(typeNames).forEach((attackingType) => {
            let multiplier = 1;
            defendingTypes.forEach((relations) => {
                if (relations.no_damage_from.some(({ name }) => name === attackingType)) multiplier = 0;
                else if (relations.double_damage_from.some(({ name }) => name === attackingType)) multiplier *= 2;
                else if (relations.half_damage_from.some(({ name }) => name === attackingType)) multiplier *= 0.5;
            });
            if (multiplier > 1) weak.set(attackingType, multiplier);
            else if (multiplier === 0) immune.add(attackingType);
            else if (multiplier < 1) resist.set(attackingType, multiplier);
        });
        return { weak, resist, immune };
    }

    function renderStats(stats) {
        return stats.map(({ base_stat, stat }) => `
            <div class="stat-row">
                <span class="stat-name">${statNames[stat.name] || formatName(stat.name)}</span>
                <span class="stat-value">${base_stat}</span>
                <span class="stat-track"><span class="stat-fill" style="display:block;width:${Math.min(base_stat / 180 * 100, 100)}%"></span></span>
            </div>`).join("");
    }

    function renderAbilities(abilities) {
        return abilities.map(({ ability, is_hidden }) =>
            `<span class="ability-chip ${is_hidden ? "hidden-ability" : ""}" title="${is_hidden ? "Habilidade oculta" : "Habilidade"}">${formatName(ability.name)}${is_hidden ? " · oculta" : ""}</span>`).join("");
    }

    async function loadMoveTypes(moves) {
        const moveTypes = new Map();
        const batchSize = 8;
        for (let index = 0; index < moves.length; index += batchSize) {
            const batch = moves.slice(index, index + batchSize);
            const details = await Promise.all(batch.map(({ move }) => api.getMove(move.url)));
            details.forEach((detail, batchIndex) => {
                moveTypes.set(batch[batchIndex].move.name, detail.type.name);
            });
        }
        return moveTypes;
    }

    function renderMoveList(moves, moveTypes) {
        const moveMap = new Map();
        moves.forEach(({ move, version_group_details }) => {
            const entry = moveMap.get(move.name) || { name: move.name, methods: new Set(), level: null };
            version_group_details.forEach(({ level_learned_at, move_learn_method }) => {
                entry.methods.add(move_learn_method.name);
                if (move_learn_method.name === "level-up" && level_learned_at > 0) {
                    entry.level = level_learned_at;
                }
            });
            moveMap.set(move.name, entry);
        });

        const orderedMoves = [...moveMap.values()].sort((a, b) => a.name.localeCompare(b.name));
        if (orderedMoves.length === 0) return '<p class="nature-note">Dados de movimentos indisponíveis.</p>';

        return `<ol class="move-list" aria-label="Golpes disponíveis, em ordem alfabética" tabindex="0">
            ${orderedMoves.map(({ name, methods, level }) => {
                const moveType = moveTypes.get(name);
                if (!moveType) throw new Error(`PokéAPI não retornou o tipo do golpe ${name}`);
                const methodLabels = [...methods]
                    .map((method) => ({
                        label: moveMethodLabels[method] || formatName(method),
                        className: moveMethodClasses[method] || ""
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(({ label, className }) => `<span class="move-method ${className}">${label}</span>`)
                    .join("");
                return `<li class="move-item"><span class="move-level">${level ?? "-"}</span><span class="move-name">${formatName(name)}</span><span class="move-type type-${escapeHTML(moveType)}">${typeLabel(moveType)}</span><span class="move-methods">${methodLabels}</span></li>`;
            }).join("")}
        </ol>`;
    }

    function renderMatchups(matchups, kind) {
        return [...matchups].map(([type, multiplier]) =>
            `${matchupMarkup(type, kind)}<span class="matchup-multiplier">${multiplier}×</span>`).join("");
    }

    function renderDetail(pokemon, species, typeData, moveTypes) {
        const descriptions = species.flavor_text_entries;
        const portugueseDescription = descriptions.find((entry) => entry.language.name === "pt-br")
            || descriptions.find((entry) => entry.language.name === "pt");
        const description = portugueseDescription?.flavor_text
            || descriptions.find((entry) => entry.language.name === "en" && entry.version.name === "scarlet")?.flavor_text
            || descriptions.find((entry) => entry.language.name === "en")?.flavor_text
            || "Informações de descrição não disponíveis.";
        const localizedName = species.names.find(({ language }) => language.name === "pt-br")?.name
            || species.names.find(({ language }) => language.name === "pt")?.name
            || formatName(pokemon.name);
        const cleanDescription = escapeHTML(description.replace(/[\n\f]/g, " "));
        const { weak, resist, immune } = getMatchups(typeData);
        const weaknessTags = renderMatchups(weak, "weak");
        const resistTags = renderMatchups(resist, "resist");
        const immuneTags = [...immune].map((type) => matchupMarkup(type, "neutral")).join("");
        const typeMarkup = pokemon.types.map(({ type }) =>
            `<span class="type-tag type-${escapeHTML(type.name)}">${typeLabel(type.name)}</span>`).join("");
        const total = statTotal(pokemon);

        detailContent.innerHTML = `
            <div class="detail-hero">
                <div class="detail-image-wrap"><img src="${escapeHTML(imageUrl(pokemon))}" alt="${formatName(pokemon.name)}"></div>
                <div>
                    <span class="detail-number">#${String(pokemon.id).padStart(4, "0")} · GERAÇÃO ${generationFor(pokemon.id)}</span>
                    <h2 class="detail-title" id="detail-name">${escapeHTML(localizedName)}</h2>
                    <div class="detail-abilities">
                        <span class="detail-abilities-label">HABILIDADES</span>
                        <div class="detail-list">${renderAbilities(pokemon.abilities)}</div>
                    </div>
                    <div class="detail-types">${typeMarkup}</div>
                    <p class="detail-description">${cleanDescription}</p>
                </div>
            </div>
            <div class="detail-body">
                <div class="detail-columns">
                    <div>
                        <section class="detail-section">
                            <h3>ATRIBUTOS BASE</h3>
                            ${renderStats(pokemon.stats)}
                            <div class="total-row"><span>Total (BST)</span><strong>${total}</strong></div>
                        </section>
                        <section class="detail-section">
                            <h3>GOLPES DISPONÍVEIS</h3>
                            <p class="nature-note move-list-note">Nível do jogo mais recente com dado disponível; “-” indica que a PokéAPI não informa nível. Lista combinada entre versões.</p>
                            <div class="move-list-heading" aria-hidden="true"><span>NÍVEL</span><span>GOLPE</span><span>TIPO</span><span>MÉTODO</span></div>
                            ${renderMoveList(pokemon.moves, moveTypes)}
                        </section>
                    </div>
                    <div>
                        <section class="detail-section">
                            <h3>PERFIL DE BATALHA</h3>
                            <div class="detail-list"><span class="ability-chip">${competitiveRole(pokemon.stats)}</span></div>
                            <p class="nature-note">Leitura indicativa baseada em atributos base. Não representa ranking ou uso no metagame.</p>
                        </section>
                        <section class="detail-section">
                            <h3>FRAQUEZAS · DANO RECEBIDO</h3>
                            <div class="matchups">${weaknessTags || '<span class="matchup-chip neutral">Sem fraquezas 2×</span>'}</div>
                        </section>
                        <section class="detail-section">
                            <h3>RESISTÊNCIAS E IMUNIDADES</h3>
                            <div class="matchups">${resistTags}${immuneTags}${resist.size + immune.size === 0 ? '<span class="matchup-chip neutral">Nenhuma</span>' : ""}</div>
                        </section>
                    </div>
                </div>
                <div class="detail-meta">
                    <span>Altura <strong>${(pokemon.height / 10).toFixed(1)} m</strong></span>
                    <span>Peso <strong>${(pokemon.weight / 10).toFixed(1)} kg</strong></span>
                    <span>Experiência base <strong>${pokemon.base_experience ?? "—"}</strong></span>
                    <span>Taxa de captura <strong>${species.capture_rate ?? "—"}/255</strong></span>
                </div>
            </div>`;
    }

    async function open(id) {
        dialog.showModal();
        detailContent.innerHTML = '<div class="detail-loading"><span class="loader"></span><span>Carregando ficha...</span></div>';
        try {
            const pokemon = await api.getPokemon(id);
            const [species, typeData, moveTypes] = await Promise.all([
                api.fetchJson(pokemon.species.url),
                Promise.all(pokemon.types.map(({ type }) => api.fetchJson(`${config.apiUrl}/type/${type.name}`))),
                loadMoveTypes(pokemon.moves)
            ]);
            renderDetail(pokemon, species, typeData, moveTypes);
        } catch (error) {
            console.error(`Erro ao carregar detalhes do Pokémon #${id}:`, error);
            detailContent.innerHTML = '<div class="detail-loading"><p>Não foi possível carregar os detalhes deste Pokémon.</p><button class="dialog-retry" type="button">Fechar</button></div>';
            detailContent.querySelector(".dialog-retry").addEventListener("click", () => dialog.close());
        }
    }

    return { open };
})();
