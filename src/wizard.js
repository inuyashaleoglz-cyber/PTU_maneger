/* ============================================================
   wizard.js · Asistente de creación del entrenador
   ============================================================ */
'use strict';

const Wizard = {
  step: 0,
  steps: [
    ['Paso 1 · Identidad',     'Lo esencial: cómo se llama y quién es.'],
    ['Paso 2 · Trasfondo',     'Una destreza Adepta, una Novata y tres Patéticas.'],
    ['Paso 3 · Edges',         'Cuatro ventajas para empezar.'],
    ['Paso 4 · Clase',         'Elige tu primera especialización.'],
    ['Paso 5 · Estadísticas',  'Reparte 10 puntos, máx. +5 por estadística.'],
    ['Paso 6 · Pokémon',       'Especie, nivel, naturaleza y reparto de puntos.'],
    ['Paso 7 · Equipo',        'Reparte 5.000₽.'],
    ['Paso 8 · Listo',         'Revisa tu ficha y compártela con tu grupo.']
  ],

  SKILLS: [
    'Acrobacias','Atletismo','Combate','Intimidación','Sigilo','Supervivencia',
    'Educación General','Educación en Medicina','Educación en Ocultismo','Educación Pokémon',
    'Educación en Tecnología','Astucia','Percepción','Encanto','Mando','Concentración','Intuición'
  ],

  init() {
    // Referencias
    this.panels = [...document.querySelectorAll('.panel')];
    this.buttons = [...document.querySelectorAll('.sbtn')];
    this.titleEl = document.getElementById('wt');
    this.descEl  = document.getElementById('wd');
    this.barEl   = document.getElementById('wb');
    this.prevBtn = document.getElementById('wprev');
    this.nextBtn = document.getElementById('wnext');

    // Llenar selects de destrezas
    const selA = document.getElementById('w-adept');
    const selN = document.getElementById('w-novice');
    this.SKILLS.forEach(s => {
      selA.appendChild(new Option(s, s));
      selN.appendChild(new Option(s, s));
    });

    // Llenar checks de Patéticas y Edges
    const wWeak = document.getElementById('w-weak');
    const wEdges = document.getElementById('w-edges');
    this.SKILLS.forEach(s => {
      wWeak.appendChild(this._check(s, 'weak'));
      wEdges.appendChild(this._check(s, 'edge'));
    });

    // Llenar selección de especie
    const selEsp = document.getElementById('w-esp');
    Data.pokemonKeys().forEach(k => {
      const pk = Data.pokemon(k);
      selEsp.appendChild(new Option(pk?.es || k, k));
    });

    // Naturalezas
    this._fillNatures();

    // Clases
    const selClase = document.getElementById('w-clase');
    Object.keys(Data.classes.classes || {}).forEach(k => {
      selClase.appendChild(new Option(k, k));
    });

    // Listeners
    this.buttons.forEach((b, i) => b.addEventListener('click', () => this.goTo(i)));
    this.prevBtn.addEventListener('click', () => this.goTo(Math.max(0, this.step - 1)));
    this.nextBtn.addEventListener('click', () => {
      if (this.step === this.steps.length - 1) { UI.show('entrenador'); return; }
      this.goTo(this.step + 1);
    });

    this._bindInputs();
    this._bindPoints();
    this._bindItems();

    this.goTo(0);
  },

  _check(skill, kind) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = skill;
    cb.dataset.kind = kind;
    const span = document.createElement('span');
    span.textContent = skill;
    label.append(cb, span);
    return label;
  },

  _fillNatures() {
    // Copia del manual PTU 1.05
    const NATURES = [
      ['— sin definir —', null, null],
      ['Adorable', 'hp', 'atk'], ['Distraído', 'hp', 'def'], ['Orgulloso', 'hp', 'spa'],
      ['Decidido', 'hp', 'spd'], ['Paciente', 'hp', 'spe'],
      ['Desesperado', 'atk', 'hp'], ['Solitario', 'atk', 'def'], ['Firme', 'atk', 'spa'],
      ['Travieso', 'atk', 'spd'], ['Valiente', 'atk', 'spe'],
      ['Severo', 'def', 'hp'], ['Osado', 'def', 'atk'], ['Pícaro', 'def', 'spa'],
      ['Relajado', 'def', 'spd'], ['Flemático', 'def', 'spe'],
      ['Curioso', 'spa', 'hp'], ['Modesto', 'spa', 'atk'], ['Apacible', 'spa', 'def'],
      ['Impulsivo', 'spa', 'spd'], ['Callado', 'spa', 'spe'],
      ['Soñador', 'spd', 'hp'], ['Sereno', 'spd', 'atk'], ['Amable', 'spd', 'def'],
      ['Cuidadoso', 'spd', 'spa'], ['Descarado', 'spd', 'spe'],
      ['Asustadizo', 'spe', 'hp'], ['Tímido', 'spe', 'atk'], ['Apresurado', 'spe', 'def'],
      ['Alegre', 'spe', 'spa'], ['Ingenuo', 'spe', 'spd'],
      ['Compuesto', null, null], ['Fuerte', null, null], ['Dócil', null, null],
      ['Excéntrico', null, null], ['Serio', null, null]
    ];
    const sel = document.getElementById('w-nat');
    NATURES.forEach((n, i) => {
      const txt = n[1] ? `${n[0]} (+${n[1]} / −${n[2]})` : n[0];
      sel.appendChild(new Option(txt, i));
    });
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
      'w-novice':   v => t().novice = v,
      'w-hab':      v => State.pokemons[0].ability = v,
      'w-movs':     v => State.pokemons[0].moves = v
    };
    Object.entries(map).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => { fn(el.value); persist(); this._refresh(); });
    });

    // Stats del entrenador
    const statIds = { 'w-hp':'hp','w-atk':'atk','w-def':'def','w-spa':'spa','w-spd':'spd','w-spe':'spe' };
    Object.entries(statIds).forEach(([id, key]) => {
      document.getElementById(id).addEventListener('input', () => {
        this._updateTrainerStats();
        persist();
      });
    });

    // Checks Patéticas
    document.getElementById('w-weak').addEventListener('change', e => {
      const checked = [...document.querySelectorAll('#w-weak input:checked')];
      if (checked.length > 3) { e.target.checked = false; return; }
      t().weak = checked.map(c => c.value);
      this._refresh();
      persist();
    });

    // Checks Edges
    document.getElementById('w-edges').addEventListener('change', e => {
      const checked = [...document.querySelectorAll('#w-edges input:checked')];
      if (checked.length > 4) { e.target.checked = false; return; }
      t().edges = checked.map(c => c.value);
      this._refresh();
      persist();
    });

    // Pokémon
    document.getElementById('w-esp').addEventListener('change', e => {
      State.pokemons[0].species = e.target.value;
      this._refresh(); persist();
    });
    document.getElementById('w-nivel-pk').addEventListener('input', e => {
      State.pokemons[0].level = Math.max(1, parseInt(e.target.value) || 1);
      this._refresh(); persist();
    });
    document.getElementById('w-nat').addEventListener('change', e => {
      State.pokemons[0].nature = parseInt(e.target.value) || 0;
      this._refresh(); persist();
    });
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
    const BASE = { hp:10, atk:5, def:5, spa:5, spd:5, spe:5 };
    const ids  = { 'w-hp':'hp','w-atk':'atk','w-def':'def','w-spa':'spa','w-spd':'spd','w-spe':'spe' };
    const fin  = { 'w-fhp':'hp','w-fatk':'atk','w-fdef':'def','w-fspa':'spa','w-fspd':'spd','w-fspe':'spe' };
    let total = 0;
    Object.entries(ids).forEach(([id, key]) => {
      const v = Math.max(0, Math.min(5, parseInt(document.getElementById(id).value) || 0));
      document.getElementById(id).value = v;
      total += v;
      State.trainer.stats[key] = BASE[key] + v;
      document.getElementById(fin[id]).textContent = State.trainer.stats[key];
    });
    const tot = document.getElementById('w-statstot');
    tot.textContent = total;
    tot.style.color = total === 10 ? 'var(--g)' : 'var(--r)';
    const t = State.trainer;
    document.getElementById('w-pg').textContent = t.level * 2 + t.stats.hp * 3 + 10;
    document.getElementById('w-ap').textContent = 5 + Math.floor(t.level / 5);
    document.getElementById('w-ef').textContent = Math.min(6, Math.floor(t.stats.def / 5));
    document.getElementById('w-ee').textContent = Math.min(6, Math.floor(t.stats.spd / 5));
    document.getElementById('w-ev').textContent = Math.min(6, Math.floor(t.stats.spe / 5));
  },

  _updateBudget() {
    const prices = { ball: 250, pot: 200, rev: 300, ant: 200 };
    let spent = 0;
    Object.entries(State.items).forEach(([k, v]) => spent += (prices[k] || 0) * v);
    document.getElementById('b-gast').textContent = spent;
    const rest = 5000 - spent;
    const el = document.getElementById('b-rest');
    el.textContent = rest;
    el.style.color = rest < 0 ? 'var(--r)' : 'var(--g)';
  },

  _refreshPreview() {
    const pk = State.pokemons[0];
    const r = this._pokemonFinal(pk);
    const div = document.getElementById('w-preview');
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

  /** Calcula las stats finales de un Pokémon con naturaleza + puntos. */
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

  /** Refresca la UI completa desde el estado. */
  _refresh() {
    const t = State.trainer;

    // Conflictos de destrezas
    const dup = new Set();
    const all = [t.adept, t.novice, ...t.weak].filter(Boolean);
    const seen = {};
    all.forEach(s => { if (seen[s]) dup.add(s); seen[s] = true; });
    document.getElementById('w-conflict').classList.toggle('hide', dup.size === 0);
    document.querySelectorAll('#w-weak label').forEach(l => {
      l.classList.toggle('conflict', dup.has(l.querySelector('input').value));
    });

    // Contadores
    const wc = document.getElementById('w-weakc');
    wc.textContent = `${t.weak.length} / 3`;
    wc.style.color = t.weak.length === 3 ? 'var(--g)' : 'var(--r)';
    const ec = document.getElementById('w-edgesc');
    ec.textContent = `${t.edges.length} / 4`;
    ec.style.color = t.edges.length === 4 ? 'var(--g)' : 'var(--dim)';

    // Base del Pokémon
    const base = Data.pokemon(State.pokemons[0].species);
    const baseDiv = document.getElementById('w-base');
    if (base) {
      baseDiv.innerHTML = `
        <div class="tw" style="margin-top:8px"><table>
          <thead><tr><th>Tipo</th><th class="num">Salud</th><th class="num">Atq</th>
            <th class="num">Def</th><th class="num">AtE</th><th class="num">DeE</th><th class="num">Vel</th></tr></thead>
          <tbody><tr>
            <td>${base.t.join(' / ')}</td>
            <td class="num">${base.hp}</td><td class="num">${base.atk}</td>
            <td class="num">${base.def}</td><td class="num">${base.spa}</td>
            <td class="num">${base.spd}</td><td class="num">${base.spe}</td>
          </tr></tbody>
        </table></div>`;
    }

    // Preview de movimientos
    const movs = (State.pokemons[0].moves || '').split('\n').map(l => l.trim()).filter(Boolean);
    const info = document.getElementById('w-movs-info');
    if (movs.length) {
      const rows = movs.map(m => {
        const mv = Data.move(m);
        return mv
          ? `<div class="move-row"><span>${m}</span><span class="mdb">DB ${mv.db} · AC ${mv.ac ?? '—'}</span><span class="tag">${mv.type}</span><span class="tag">${mv.class}</span></div>`
          : `<div class="move-row"><span>${m}</span><span class="move-warn">desconocido</span></div>`;
      }).join('');
      const warn = movs.length > 6
        ? `<div class="call err" style="margin:8px 0"><span class="lbl">Límite</span>Tienes ${movs.length} movimientos. Máximo 6.</div>`
        : '';
      info.innerHTML = `<div class="moves-list">${rows}</div>${warn}`;
    } else {
      info.innerHTML = '';
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

    document.getElementById('w-final').innerHTML = `
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
        <h4>Equipo</h4>
        <p>${items}</p>
      </div>`;
  }
};