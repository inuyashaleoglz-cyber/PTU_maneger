/* ============================================================
   wizard.js · Asistente de creación del entrenador
   Incluye: "Elige por mí" + banco de conceptos
   Bugs arreglados: reparto de 15 puntos, auto-marcado de movimientos,
   naturaleza fija, respeto del nivel, escape HTML.
   ============================================================ */
'use strict';

const Wizard = {
  step: 0,
  steps: [
    ['Paso 1 · Identidad',     'Lo esencial: cómo se llama y quién es.'],
    ['Paso 2 · Trasfondo',     'Una destreza Adepta, una Novata y tres Patéticas.'],
    ['Paso 3 · Ventajas',      'Cuatro ventajas para empezar.'],
    ['Paso 4 · Clase',         'Elige tu primera especialización.'],
    ['Paso 5 · Estadísticas',  'Reparte 10 puntos, máx. +5 por estadística.'],
    ['Paso 6 · Pokémon',       'Especie, nivel, naturaleza, habilidad y movimientos.'],
    ['Paso 7 · Equipo',        'Reparte 5.000₽.'],
    ['Paso 8 · Listo',         'Revisa tu ficha y compártela con tu grupo.']
  ],

  SKILLS: [
    'Acrobacias','Atletismo','Combate','Intimidación','Sigilo','Supervivencia',
    'Educación General','Educación en Medicina','Educación en Ocultismo','Educación Pokémon',
    'Educación en Tecnología','Astucia','Percepción','Encanto','Mando','Concentración','Intuición'
  ],

  CONCEPTS: [
    'Joven del pueblo que sueña con ser campeón',
    'Hijo de granjeros que cuida Pokémon heridos',
    'Ex-miembro de una banda que busca redención',
    'Investigador de campo fascinado por los Pokémon raros',
    'Criador que trata a sus Pokémon como familia',
    'Atleta que entrena tan duro como sus Pokémon',
    'Artista que pinta a sus compañeros en cada ciudad',
    'Cocinero viajero que prepara comida para Pokémon',
    'Cazador de tesoros que busca ruinas antiguas',
    'Médico en formación que cura Pokémon salvajes',
    'Estudiante que investiga la evolución de las especies',
    'Músico callejero que conecta con Pokémon por el sonido',
    'Ex-soldado que protege a los débiles',
    'Niño rico que huye de casa para vivir aventuras',
    'Fotógrafo que documenta Pokémon en su hábitat',
    'Bibliotecario que dejó los libros por el mundo real',
    'Explorador de cuevas que busca Pokémon de las profundidades',
    'Domador de un solo tipo por tradición familiar',
    'Aventurero que solo captura Pokémon que considera amigos',
    'Entrenador que colecciona historias de cada Pokémon que ve'
  ],

  // Naturaleza por defecto: "Compuesto" (neutral). Va al índice 31 del array.
  DEFAULT_NATURE: 31,

  init() {
    this.panels = [...document.querySelectorAll('.panel')];
    this.buttons = [...document.querySelectorAll('.sbtn')];
    this.titleEl = document.getElementById('wt');
    this.descEl  = document.getElementById('wd');
    this.barEl   = document.getElementById('wb');
    this.prevBtn = document.getElementById('wprev');
    this.nextBtn = document.getElementById('wnext');

    const selA = document.getElementById('w-adept');
    const selN = document.getElementById('w-novice');
    this.SKILLS.forEach(s => {
      selA.appendChild(new Option(s, s));
      selN.appendChild(new Option(s, s));
    });

    const wWeak = document.getElementById('w-weak');
    const wEdges = document.getElementById('w-edges');
    this.SKILLS.forEach(s => {
      wWeak.appendChild(this._check(s));
      wEdges.appendChild(this._check(s));
    });

    const selEsp = document.getElementById('w-esp');
    Data.pokemonKeys().forEach(k => {
      const pk = Data.pokemon(k);
      selEsp.appendChild(new Option(pk?.es || k, k));
    });

    this._fillNatures();

    const selClase = document.getElementById('w-clase');
    Object.keys(Data.classes.classes || {}).forEach(k => {
      selClase.appendChild(new Option(k, k));
    });

    this.buttons.forEach((b, i) => b.addEventListener('click', () => this.goTo(i)));
    this.prevBtn.addEventListener('click', () => this.goTo(Math.max(0, this.step - 1)));
    this.nextBtn.addEventListener('click', () => {
      if (this.step === this.steps.length - 1) { UI.show('entrenador'); return; }
      this.goTo(this.step + 1);
    });

    this._bindInputs();
    this._bindPoints();
    this._bindItems();

    // Botones "Elige por mí"
    document.querySelectorAll('.elige-por-mi').forEach(btn => {
      btn.addEventListener('click', () => this._autoFill(parseInt(btn.dataset.step)));
    });

    // Botón de ideas de concepto
    const btnIdea = document.getElementById('btnIdeaConcepto');
    const ideasBox = document.getElementById('ideasConcepto');
    const ideasList = document.getElementById('ideasConceptoList');
    if (btnIdea && ideasBox && ideasList) {
      ideasList.innerHTML = this.CONCEPTS.map((c, i) =>
        `<button type="button" class="idea-btn" data-idx="${i}">${this._escapeHtml(c)}</button>`
      ).join('');
      ideasList.querySelectorAll('.idea-btn').forEach(b => {
        b.addEventListener('click', () => {
          const txt = this.CONCEPTS[parseInt(b.dataset.idx)];
          document.getElementById('w-concepto').value = txt;
          State.trainer.concept = txt;
          persist();
          ideasBox.classList.add('hide');
        });
      });
      btnIdea.addEventListener('click', () => ideasBox.classList.toggle('hide'));
    }

    this.goTo(0);
  },

  _escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _check(skill) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = skill;
    const span = document.createElement('span');
    span.textContent = skill;
    label.append(cb, span);
    return label;
  },

  _fillNatures() {
    const NATURES = [
      '— sin definir —',
      'Adorable (+hp / −atk)', 'Distraído (+hp / −def)', 'Orgulloso (+hp / −spa)',
      'Decidido (+hp / −spd)', 'Paciente (+hp / −spe)',
      'Desesperado (+atk / −hp)', 'Solitario (+atk / −def)', 'Firme (+atk / −spa)',
      'Travieso (+atk / −spd)', 'Valiente (+atk / −spe)',
      'Severo (+def / −hp)', 'Osado (+def / −atk)', 'Pícaro (+def / −spa)',
      'Relajado (+def / −spd)', 'Flemático (+def / −spe)',
      'Curioso (+spa / −hp)', 'Modesto (+spa / −atk)', 'Apacible (+spa / −def)',
      'Impulsivo (+spa / −spd)', 'Callado (+spa / −spe)',
      'Soñador (+spd / −hp)', 'Sereno (+spd / −atk)', 'Amable (+spd / −def)',
      'Cuidadoso (+spd / −spa)', 'Descarado (+spd / −spe)',
      'Asustadizo (+spe / −hp)', 'Tímido (+spe / −atk)', 'Apresurado (+spe / −def)',
      'Alegre (+spe / −spa)', 'Ingenuo (+spe / −spd)',
      'Compuesto (neutral)', 'Fuerte (neutral)', 'Dócil (neutral)',
      'Excéntrico (neutral)', 'Serio (neutral)'
    ];
    const sel = document.getElementById('w-nat');
    NATURES.forEach((n, i) => sel.appendChild(new Option(n, i)));
  },

  _bindInputs() {
    const t = () => State.trainer;

    const map = {
      'w-nombre':   v => t().name = v,
      'w-nivel':    v => t().level = Math.max(1, parseInt(v) || 1),
      'w-concepto': v => t().concept = v,
      'w-historia': v => t().story = v,
      'w-clase':    v => t().clase = v,
      'w-train':    v => t().training = v,
      'w-adept':    v => t().adept = v,
      'w-novice':   v => t().novice = v
    };
    Object.entries(map).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => { fn(el.value); persist(); this._refresh(); });
    });

    const habSel = document.getElementById('w-hab');
    if (habSel) {
      habSel.addEventListener('change', () => {
        State.pokemons[0].ability = habSel.value;
        persist();
      });
    }

    ['w-hp','w-atk','w-def','w-spa','w-spd','w-spe'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => { this._updateTrainerStats(); persist(); });
    });

    document.getElementById('w-weak').addEventListener('change', e => {
      const checked = [...document.querySelectorAll('#w-weak input:checked')];
      if (checked.length > 3) { e.target.checked = false; return; }
      t().weak = checked.map(c => c.value);
      this._refresh();
      persist();
    });

    document.getElementById('w-edges').addEventListener('change', e => {
      const checked = [...document.querySelectorAll('#w-edges input:checked')];
      if (checked.length > 4) { e.target.checked = false; return; }
      t().edges = checked.map(c => c.value);
      this._refresh();
      persist();
    });

    document.getElementById('w-esp').addEventListener('change', e => {
      State.pokemons[0].species = e.target.value;
      State.pokemons[0].moves = '';
      this._refresh();
      this._refreshPokemonSelectors();
      persist();
    });
    document.getElementById('w-nivel-pk').addEventListener('input', e => {
      State.pokemons[0].level = Math.max(1, parseInt(e.target.value) || 1);
      this._refresh();
      this._refreshPokemonSelectors();
      persist();
    });
    document.getElementById('w-nat').addEventListener('change', e => {
      State.pokemons[0].nature = parseInt(e.target.value) || 0;
      this._refresh();
      persist();
    });
  },

  /* ============================================================
     "ELIGE POR MÍ"
     ============================================================ */
  _autoFill(step) {
    switch (step) {
      case 0: this._autoIdentidad(); break;
      case 1: this._autoTrasfondo(); break;
      case 2: this._autoVentajas(); break;
      case 3: this._autoClase(); break;
      case 4: this._autoStats(); break;
      case 5: this._autoPokemon(); break;
      case 6: this._autoEquipo(); break;
    }
    persist();
    this._refresh();
    if (step === 5) this._refreshPokemonSelectors();
  },

  _autoIdentidad() {
    const t = State.trainer;
    if (!t.name) t.name = 'Kai';
    if (!t.concept) t.concept = 'Entrenador curioso que viaja buscando descubrir su primer Pokémon legendario';
    if (!t.story) t.story = 'Creció en un pueblo pequeño escuchando historias de entrenadores famosos. Ahora emprende su propio viaje para demostrar que cualquiera puede llegar lejos con esfuerzo.';
    document.getElementById('w-nombre').value = t.name;
    document.getElementById('w-concepto').value = t.concept;
    document.getElementById('w-historia').value = t.story;
    this._showExplanation(0,
      '<b>Nombre:</b> Kai (puedes cambiarlo por el que quieras).<br>' +
      '<b>Concepto:</b> una frase que resume a tu personaje. Empieza simple, siempre puedes afinarlo.<br>' +
      '<b>Historia:</b> dos frases bastan. No necesitas un trasfondo épico para empezar a jugar.'
    );
  },

  _autoTrasfondo() {
    const t = State.trainer;
    t.adept = 'Educación Pokémon';
    t.novice = 'Combate';
    t.weak = ['Educación en Tecnología', 'Educación en Ocultismo', 'Astucia'];
    document.getElementById('w-adept').value = t.adept;
    document.getElementById('w-novice').value = t.novice;
    document.querySelectorAll('#w-weak input').forEach(cb =>
      cb.checked = t.weak.includes(cb.value));
    this._refresh();
    this._showExplanation(1,
      '<b>Adepto — Educación Pokémon:</b> entender a tus Pokémon es lo más útil en casi cualquier partida.<br>' +
      '<b>Novato — Combate:</b> sirve para casi todo: pelear, defenderte, intimidar.<br>' +
      '<b>Patéticas:</b> dejamos las que probablemente uses menos en tus primeras sesiones. Puedes cambiarlo cuando quieras.'
    );
  },

  _autoVentajas() {
    const t = State.trainer;
    t.edges = ['Atletismo', 'Acrobacias', 'Percepción', 'Encanto'];
    document.querySelectorAll('#w-edges input').forEach(cb =>
      cb.checked = t.edges.includes(cb.value));
    this._refresh();
    this._showExplanation(2,
      '<b>Atletismo y Acrobacias:</b> moverte bien evita muchos problemas.<br>' +
      '<b>Percepción:</b> notar cosas que otros no ven es oro en investigación.<br>' +
      '<b>Encanto:</b> a veces hablar convence más que pelear.'
    );
  },

  _autoClase() {
    const t = State.trainer;
    t.clase = 'Entrenador Estrella';
    t.training = 'Entrenamiento de Agilidad';
    document.getElementById('w-clase').value = t.clase;
    document.getElementById('w-train').value = t.training;
    this._showExplanation(3,
      '<b>Clase — Entrenador Estrella:</b> la más sencilla y flexible. Potencia a un Pokémon favorito sin obligarte a nada específico.<br>' +
      '<b>Entrenamiento — Agilidad:</b> tu Pokémon se mueve mejor y actúa antes en combate. Buena opción para empezar.'
    );
  },

  _autoStats() {
    const t = State.trainer;
    const dist = { hp: 4, atk: 0, def: 3, spa: 0, spd: 0, spe: 3 };
    Object.entries(dist).forEach(([k, v]) => {
      document.getElementById('w-' + k).value = v;
      t.stats[k] = ({ hp: 10, atk: 5, def: 5, spa: 5, spd: 5, spe: 5 })[k] + v;
    });
    this._updateTrainerStats();
    this._showExplanation(4,
      '<b>Salud +4:</b> más Puntos de Golpe = aguantas más en combate.<br>' +
      '<b>Defensa +3:</b> recibes menos daño físico.<br>' +
      '<b>Velocidad +3:</b> actúas antes y esquivas mejor.<br>' +
      'Dejamos Ataque y las especiales a 0 porque tu Pokémon es quien ataca, no tú. Si tu personaje va a pelear directamente, sube Ataque en su lugar.'
    );
  },

  _autoPokemon() {
    const p = State.pokemons[0];

    // Especie: mantener la actual o poner Bulbasaur
    if (!p.species) p.species = 'Bulbasaur';

    // Nivel: NO resetear si el usuario lo cambió
    const lvlInput = document.getElementById('w-nivel-pk');
    const currentLvl = parseInt(lvlInput.value) || 0;
    if (!currentLvl || currentLvl < 1) {
      p.level = 5;
      lvlInput.value = 5;
    } else {
      p.level = currentLvl;
    }

    // Naturaleza: usar valor fijo y sensato (Compuesto, neutral)
    p.nature = this.DEFAULT_NATURE;
    document.getElementById('w-nat').value = p.nature;

    document.getElementById('w-esp').value = p.species;

    // Reparto: 15 puntos exactos (5 + 4 + 3 + 2 + 1 + 0)
    const base = Data.pokemon(p.species);
    if (base) {
      const statKeys = ['hp','atk','def','spa','spd','spe'];
      // Ordenar por base descendente
      const sorted = statKeys.slice().sort((a, b) => base[b] - base[a]);
      // Pesos: top stats reciben más puntos, 0 al más débil
      const weights = [5, 4, 3, 2, 1, 0];
      const dist = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      sorted.forEach((stat, i) => { dist[stat] = weights[i]; });

      // Garantizar hp >= 2
      if (dist.hp < 2) {
        const diff = 2 - dist.hp;
        dist.hp = 2;
        let removed = 0;
        for (const s of sorted) {
          if (s === 'hp' || removed >= diff) continue;
          const take = Math.min(dist[s], diff - removed);
          dist[s] -= take;
          removed += take;
        }
      }

      // Verificación final: exactamente 15
      let total = Object.values(dist).reduce((a, b) => a + b, 0);
      // Si por alguna razón no suma 15, ajustar al stat principal
      if (total !== 15) {
        dist[sorted[0]] += (15 - total);
      }

      p.points = dist;
      document.querySelectorAll('#w-ppoints input').forEach(inp => {
        inp.value = dist[inp.dataset.pk] || 0;
      });
    }

    // Auto-marcar los primeros 4 movimientos disponibles
    if (base && base.moves?.level) {
      const learned = base.moves.level
        .filter(m => m.lvl <= p.level)
        .sort((a, b) => a.lvl - b.lvl);
      const selected = learned.slice(0, Math.min(4, learned.length)).map(m => m.name);
      p.moves = selected.join('\n');
    }

    // Auto-seleccionar la primera habilidad básica
    if (base && base.abilities?.basic?.length) {
      p.ability = base.abilities.basic[0];
    }

    this._refreshPokemonSelectors();
    this._refresh();

    const naturalezaNombre = document.getElementById('w-nat').options[p.nature]?.text || '—';
    const movsList = (p.moves || '').split('\n').filter(Boolean);

    this._showExplanation(5,
      '<b>Especie:</b> ' + (base?.es || p.species) + '. Un clásico con tres etapas evolutivas, fácil de llevar.<br>' +
      '<b>Nivel ' + p.level + ':</b> el estándar para empezar.<br>' +
      '<b>Naturaleza:</b> ' + naturalezaNombre + '. Puedes cambiarla.<br>' +
      '<b>Puntos:</b> repartidos hacia sus mejores estadísticas base.<br>' +
      '<b>Habilidad:</b> la primera básica de la especie.<br>' +
      '<b>Movimientos marcados:</b> ' + (movsList.length ? movsList.join(', ') : 'ninguno disponible a este nivel') + '.'
    );
  },

  _autoEquipo() {
    const items = { ball: 6, pot: 5, rev: 1, ant: 3 };
    State.items = items;
    Object.entries(items).forEach(([k, v]) => {
      const el = document.getElementById('b-' + k);
      if (el) el.value = v;
    });
    this._updateBudget();
    this._showExplanation(6,
      '<b>6 Poké Balls:</b> suficientes para intentar varias capturas.<br>' +
      '<b>5 Pociones:</b> curan 20 PG cada una.<br>' +
      '<b>1 Revivir:</b> para emergencias.<br>' +
      '<b>3 Antídotos:</b> el veneno es un problema común.<br>' +
      'Te quedan 1.600₽ para lo que surja en la aventura.'
    );
  },

  _showExplanation(step, html) {
    const exp = document.getElementById('explain-' + step);
    if (!exp) return;
    exp.innerHTML = '<span class="lbl">Elegido por ti</span>' + html;
    exp.style.display = 'block';
    exp.classList.remove('hide');
  },

  /* ============================================================
     SELECTORES DE HABILIDAD Y MOVIMIENTOS
     ============================================================ */
  _refreshPokemonSelectors() {
    const pk = State.pokemons[0];
    const base = Data.pokemon(pk.species);
    if (!base) return;

    // Habilidad
    const habSel = document.getElementById('w-hab');
    if (habSel) {
      const prev = pk.ability || '';
      habSel.innerHTML = '';
      habSel.appendChild(new Option('— sin elegir —', ''));
      const groups = [];
      if (base.abilities?.basic?.length)
        groups.push({ label: 'Básica', items: base.abilities.basic });
      if (base.abilities?.advanced?.length)
        groups.push({ label: 'Avanzada', items: base.abilities.advanced });
      if (base.abilities?.high)
        groups.push({ label: 'Alta', items: [base.abilities.high] });

      groups.forEach(g => {
        const og = document.createElement('optgroup');
        og.label = g.label;
        g.items.forEach(h => {
          const info = Data.abilities[h];
          const txt = info ? `${h} — ${info.desc}` : h;
          og.appendChild(new Option(txt, h));
        });
        habSel.appendChild(og);
      });
      habSel.value = prev;
      if (!habSel.value) {
        const first = base.abilities?.basic?.[0];
        if (first) {
          habSel.value = first;
          pk.ability = first;
        }
      }
    }

    // Movimientos
    const movsBox = document.getElementById('w-movs-selector');
    if (movsBox) {
      const current = (pk.moves || '').split('\n').map(l => l.trim()).filter(Boolean);
      const learned = (base.moves?.level || [])
        .filter(m => m.lvl <= pk.level)
        .sort((a, b) => a.lvl - b.lvl);

      if (!learned.length) {
        movsBox.innerHTML = '<p style="color:var(--dim);font-size:13px;margin:6px 0">Este Pokémon no tiene movimientos disponibles al nivel ' + pk.level + '.</p>';
        return;
      }

      movsBox.innerHTML = `
        <p style="font-size:12.5px;color:var(--dim);margin:0 0 6px">
          Marca hasta <b>6</b> movimientos. Ya tienes <span id="w-movs-count">${current.length}</span>/6.
        </p>
        <div class="chk-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
          ${learned.map(m => {
            const info = Data.move(m.name);
            const isChecked = current.includes(m.name);
            const dbTxt = info ? `DB ${info.db}` : '—';
            const acTxt = info ? `AC ${info.ac ?? '—'}` : '';
            const tipo = info ? info.type : (m.t || '');
            return `<label title="${info?.effect || ''}">
              <input type="checkbox" data-move="${m.name}" ${isChecked ? 'checked' : ''}>
              <span>
                <b>${m.name}</b>
                <br><small style="color:var(--dim)">Nv.${m.lvl} · ${dbTxt} · ${acTxt} · ${tipo}</small>
              </span>
            </label>`;
          }).join('')}
        </div>`;

      movsBox.querySelectorAll('input[data-move]').forEach(cb => {
        cb.addEventListener('change', () => {
          const sel = [...movsBox.querySelectorAll('input[data-move]:checked')].map(c => c.dataset.move);
          if (sel.length > 6) { cb.checked = false; return; }
          pk.moves = sel.join('\n');
          const cEl = document.getElementById('w-movs-count');
          if (cEl) cEl.textContent = sel.length;
          persist();
        });
      });
    }
  },

  _bindPoints() {
    document.querySelectorAll('#w-ppoints input').forEach(inp => {
      inp.addEventListener('input', () => {
        const max = State.pokemons[0].level + 10;
        let used = 0;
        document.querySelectorAll('#w-ppoints input').forEach(i2 => {
          const v = Math.max(0, parseInt(i2.value) || 0);
          i2.value = v;
          used += v;
          State.pokemons[0].points[i2.dataset.pk] = v;
        });
        const tot = document.getElementById('w-ptot');
        tot.textContent = `${used} / ${max}`;
        tot.style.color = used === max ? 'var(--g)' : 'var(--r)';
        this._refreshPreview();
        persist();
      });
    });
  },

  _bindItems() {
    const map = { 'b-ball':'ball', 'b-pot':'pot', 'b-rev':'rev', 'b-ant':'ant' };
    Object.entries(map).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        State.items[key] = Math.max(0, parseInt(el.value) || 0);
        this._updateBudget();
        persist();
      });
    });
  },

  _updateTrainerStats() {
    const BASE = { hp: 10, atk: 5, def: 5, spa: 5, spd: 5, spe: 5 };
    const MAP = {
      'w-hp':  ['hp',  'w-fhp'],
      'w-atk': ['atk', 'w-fatk'],
      'w-def': ['def', 'w-fdef'],
      'w-spa': ['spa', 'w-fspa'],
      'w-spd': ['spd', 'w-fspd'],
      'w-spe': ['spe', 'w-fspe']
    };
    let total = 0;
    Object.entries(MAP).forEach(([inputId, [key, displayId]]) => {
      const inputEl = document.getElementById(inputId);
      const displayEl = document.getElementById(displayId);
      if (!inputEl || !displayEl) return;
      const v = Math.max(0, Math.min(5, parseInt(inputEl.value) || 0));
      inputEl.value = v;
      total += v;
      State.trainer.stats[key] = BASE[key] + v;
      displayEl.textContent = State.trainer.stats[key];
    });

    const tot = document.getElementById('w-statstot');
    if (tot) {
      tot.textContent = total;
      tot.style.color = total === 10 ? 'var(--g)' : 'var(--r)';
    }

    const t = State.trainer;
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('w-pg',  t.level * 2 + t.stats.hp * 3 + 10);
    setTxt('w-ap',  5 + Math.floor(t.level / 5));
    setTxt('w-ef',  Math.min(6, Math.floor(t.stats.def / 5)));
    setTxt('w-ee',  Math.min(6, Math.floor(t.stats.spd / 5)));
    setTxt('w-ev',  Math.min(6, Math.floor(t.stats.spe / 5)));
  },

  _updateBudget() {
    const prices = { ball: 250, pot: 200, rev: 300, ant: 200 };
    let spent = 0;
    Object.entries(State.items).forEach(([k, v]) => spent += (prices[k] || 0) * v);
    const g = document.getElementById('b-gast');
    if (g) g.textContent = spent;
    const rest = 5000 - spent;
    const el = document.getElementById('b-rest');
    if (el) {
      el.textContent = rest;
      el.style.color = rest < 0 ? 'var(--r)' : 'var(--g)';
    }
  },

  _refreshPreview() {
    const pk = State.pokemons[0];
    const r = this._pokemonFinal(pk);
    const div = document.getElementById('w-preview');
    if (!div) return;
    if (!r) { div.innerHTML = ''; return; }

    const ev = s => Math.min(6, Math.floor(s / 5));
    div.innerHTML = `
      <div class="stats" style="margin-top:10px">
        <div class="stat"><b>Salud</b><span>${r.hp}</span></div>
        <div class="stat"><b>Ataque</b><span>${r.atk}</span></div>
        <div class="stat"><b>Defensa</b><span>${r.def}</span></div>
        <div class="stat"><b>At. Esp.</b><span>${r.spa}</span></div>
        <div class="stat"><b>Def. Esp.</b><span>${r.spd}</span></div>
        <div class="stat"><b>Velocidad</b><span>${r.spe}</span></div>
      </div>
      <div class="stats" style="margin-top:8px">
        <div class="stat"><b>PG</b><span>${pk.level + r.hp * 3 + 10}</span></div>
        <div class="stat"><b>Ev. Fís.</b><span>${ev(r.def)}</span></div>
        <div class="stat"><b>Ev. Esp.</b><span>${ev(r.spd)}</span></div>
        <div class="stat"><b>Ev. Vel.</b><span>${ev(r.spe)}</span></div>
      </div>`;
  },

  _pokemonFinal(pk) {
    const base = Data.pokemon(pk.species);
    if (!base) return null;
    const NATURES = [
      null,
      { up:'hp', dn:'atk' }, { up:'hp', dn:'def' }, { up:'hp', dn:'spa' },
      { up:'hp', dn:'spd' }, { up:'hp', dn:'spe' },
      { up:'atk', dn:'hp' }, { up:'atk', dn:'def' }, { up:'atk', dn:'spa' },
      { up:'atk', dn:'spd' }, { up:'atk', dn:'spe' },
      { up:'def', dn:'hp' }, { up:'def', dn:'atk' }, { up:'def', dn:'spa' },
      { up:'def', dn:'spd' }, { up:'def', dn:'spe' },
      { up:'spa', dn:'hp' }, { up:'spa', dn:'atk' }, { up:'spa', dn:'def' },
      { up:'spa', dn:'spd' }, { up:'spa', dn:'spe' },
      { up:'spd', dn:'hp' }, { up:'spd', dn:'atk' }, { up:'spd', dn:'def' },
      { up:'spd', dn:'spa' }, { up:'spd', dn:'spe' },
      { up:'spe', dn:'hp' }, { up:'spe', dn:'atk' }, { up:'spe', dn:'def' },
      { up:'spe', dn:'spa' }, { up:'spe', dn:'spd' },
      null, null, null, null, null
    ];
    const nat = NATURES[pk.nature];
    const out = {};
    ['hp','atk','def','spa','spd','spe'].forEach(k => {
      let v = base[k];
      if (nat) {
        if (nat.up === k) v += (k === 'hp' ? 1 : 2);
        if (nat.dn === k) v -= (k === 'hp' ? 1 : 2);
      }
      v += pk.points[k] || 0;
      out[k] = Math.max(1, v);
    });
    return out;
  },

  _refresh() {
    const t = State.trainer;

    const dup = new Set();
    const all = [t.adept, t.novice, ...t.weak].filter(Boolean);
    const seen = {};
    all.forEach(s => { if (seen[s]) dup.add(s); seen[s] = true; });
    const conflictEl = document.getElementById('w-conflict');
    if (conflictEl) conflictEl.classList.toggle('hide', dup.size === 0);
    document.querySelectorAll('#w-weak label').forEach(l => {
      l.classList.toggle('conflict', dup.has(l.querySelector('input').value));
    });

    const wc = document.getElementById('w-weakc');
    if (wc) {
      wc.textContent = `${t.weak.length} / 3`;
      wc.style.color = t.weak.length === 3 ? 'var(--g)' : 'var(--r)';
    }
    const ec = document.getElementById('w-edgesc');
    if (ec) {
      ec.textContent = `${t.edges.length} / 4`;
      ec.style.color = t.edges.length === 4 ? 'var(--g)' : 'var(--dim)';
    }

    const base = Data.pokemon(State.pokemons[0].species);
    const baseDiv = document.getElementById('w-base');
    if (baseDiv && base) {
      baseDiv.innerHTML = `
        <div class="tw" style="margin-top:8px"><table>
          <thead><tr><th>Tipo</th><th class="num">Salud</th><th class="num">Atq</th>
            <th class="num">Def</th><th class="num">AtE</th><th class="num">DeE</th><th class="num">Vel</th></tr></thead>
          <tbody><tr>
            <td>${base.t.map(ty => `<span class="tag" data-type="${ty}" style="font-size:10px;padding:1px 6px">${ty}</span>`).join(' ')}</td>
            <td class="num">${base.hp}</td><td class="num">${base.atk}</td>
            <td class="num">${base.def}</td><td class="num">${base.spa}</td>
            <td class="num">${base.spd}</td><td class="num">${base.spe}</td>
          </tr></tbody>
        </table></div>`;
    }

    this._refreshPreview();
    UI.updateChip();
  },

  goTo(i) {
    this.step = i;
    this.panels.forEach((p, idx) => p.classList.toggle('on', idx === i));
    this.buttons.forEach((b, idx) => {
      b.classList.toggle('on', idx === i);
      b.classList.toggle('done', idx < i);
    });
    this.titleEl.textContent = this.steps[i][0];
    this.descEl.textContent = this.steps[i][1];
    this.barEl.style.width = ((i + 1) / this.steps.length * 100) + '%';
    this.prevBtn.disabled = i === 0;
    this.nextBtn.textContent = i === this.steps.length - 1 ? 'Terminar ✓' : 'Siguiente →';

    if (i === 5) this._refreshPokemonSelectors();
    if (i === this.steps.length - 1) this._renderFinal();
    this._refresh();
  },

  _renderFinal() {
    const t = State.trainer;
    const pk = State.pokemons[0];
    const base = Data.pokemon(pk.species);
    const itemNames = { ball:'Poké Balls', pot:'Pociones', rev:'Revivir', ant:'Antídotos' };
    const items = Object.entries(State.items)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v}× ${itemNames[k]}`)
      .join(' · ') || 'Sin equipo anotado';
    const movsList = (pk.moves || '').split('\n').filter(Boolean);

    const finalDiv = document.getElementById('w-final');
    if (!finalDiv) return;
    finalDiv.innerHTML = `
      <div class="sheet">
        <h3>${t.name || 'Entrenador sin nombre'} · Nivel ${t.level}</h3>
        ${t.concept ? `<p><b>Concepto:</b> ${t.concept}</p>` : ''}
        ${t.story ? `<p><b>Historia:</b> ${t.story}</p>` : ''}
        <h4>Estadísticas</h4>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${t.stats.hp}</span></div>
          <div class="stat"><b>Ataque</b><span>${t.stats.atk}</span></div>
          <div class="stat"><b>Defensa</b><span>${t.stats.def}</span></div>
          <div class="stat"><b>At. Esp.</b><span>${t.stats.spa}</span></div>
          <div class="stat"><b>Def. Esp.</b><span>${t.stats.spd}</span></div>
          <div class="stat"><b>Velocidad</b><span>${t.stats.spe}</span></div>
        </div>
        <h4>Destrezas</h4>
        <p>Adepto: <b>${t.adept}</b> · Novato: <b>${t.novice}</b> · Patéticas: <b>${t.weak.join(', ') || '—'}</b></p>
        <h4>Pokémon inicial</h4>
        <p><b>${pk.nickname || pk.species}</b> · Nv.${pk.level} · ${base ? base.t.join(' / ') : '—'}</p>
        ${pk.ability ? `<p><b>Habilidad:</b> ${pk.ability}</p>` : ''}
        ${movsList.length ? `<p><b>Movimientos:</b> ${movsList.join(', ')}</p>` : ''}
        <h4>Equipo</h4>
        <p>${items}</p>
      </div>`;
  }
};
