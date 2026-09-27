/* ============================================================
   pokemon.js · Lista y detalle de Pokémon
   ============================================================ */
'use strict';

const Pokemon = {
  showList() {
    document.getElementById('pokemonsListView').classList.remove('hide');
    document.getElementById('pokemonDetailView').classList.add('hide');
    this.renderList();
  },

  renderList() {
    const el = document.getElementById('pokemonsListView');
    const list = State.pokemons;

    el.innerHTML = `
      <div class="card t">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <h3 style="margin:0">Tu equipo (${list.length})</h3>
          <button class="btn" id="pk-add">+ Añadir Pokémon</button>
        </div>
      </div>
      <div class="grid c2">
        ${list.map(p => this._cardHTML(p)).join('')}
      </div>`;

    el.querySelector('#pk-add').addEventListener('click', () => this.add());
    el.querySelectorAll('.pokemon-card').forEach(c =>
      c.addEventListener('click', () => this.showDetail(c.dataset.pkid)));
  },

  _cardHTML(p) {
    const base = Data.pokemon(p.species);
    if (!base) return '';
    const stats = this._stats(p);
    const pgMax = p.level + stats.hp * 3 + 10;
    const pgNow = p.hpCurrent === null ? pgMax : p.hpCurrent;
    const pct = pgMax ? Math.max(0, Math.min(100, (pgNow / pgMax) * 100)) : 0;
    const cls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
    const active = p.id === State.activePokemonId;

    return `
      <div class="pokemon-card ${active ? 'active' : ''}" data-pkid="${p.id}">
        <div class="pc-head">
          <div>
            <div class="pc-name">${p.nickname || base.es || p.species}${active ? ' <span class="tag g">activo</span>' : ''}</div>
            <div style="font-size:12px;color:var(--dim)">Nv. ${p.level}</div>
          </div>
        </div>
        <div class="pc-types">${base.t.map(t => `<span class="tag b">${t}</span>`).join('')}</div>
        <div class="hpbar ${cls}"><i style="width:${pct}%"></i></div>
        <div class="pc-stats">
          <span>PG ${pgNow}/${pgMax}</span>
          <span>Atq ${stats.atk}</span>
          <span>Def ${stats.def}</span>
          <span>Vel ${stats.spe}</span>
          ${p.heridas ? `<span style="color:var(--r)">Heridas: ${p.heridas}</span>` : ''}
        </div>
      </div>`;
  },

  add() {
    const p = emptyPokemon();
    State.pokemons.push(p);
    persist();
    UI.updateChip();
    this.renderList();
  },

  remove(id) {
    if (State.pokemons.length <= 1) { alert('Debes tener al menos un Pokémon.'); return; }
    if (!confirm('¿Eliminar este Pokémon?')) return;
    State.pokemons = State.pokemons.filter(p => p.id !== id);
    if (State.activePokemonId === id) State.activePokemonId = State.pokemons[0].id;
    persist();
    UI.updateChip();
    this.showList();
  },

  setActive(id) {
    State.activePokemonId = id;
    persist();
    UI.updateChip();
    this.renderList();
  },

  showDetail(id) {
    const p = State.pokemons.find(x => x.id === id);
    if (!p) return;
    const base = Data.pokemon(p.species);
    if (!base) { alert('Especie no reconocida: ' + p.species); return; }

    document.getElementById('pokemonsListView').classList.add('hide');
    const el = document.getElementById('pokemonDetailView');
    el.classList.remove('hide');

    const stats = this._stats(p);
    const pgMax = p.level + stats.hp * 3 + 10;
    const pgNow = p.hpCurrent === null ? pgMax : p.hpCurrent;
    const isActive = p.id === State.activePokemonId;

    el.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          <button class="btn ghost xs" id="pk-back">← Volver</button>
          <div style="display:flex;gap:6px">
            ${!isActive ? `<button class="btn sm" id="pk-activate">Marcar activo</button>` : '<span class="tag g">Activo</span>'}
            <button class="btn r sm" id="pk-del">Eliminar</button>
          </div>
        </div>

        <div class="row wide">
          <div class="field"><label>Apodo</label>
            <input id="pd-nick" value="${p.nickname || ''}" placeholder="${base.es || p.species}"></div>
          <div class="field"><label>Especie</label>
            <select id="pd-esp">
              ${Data.pokemonKeys().map(k => {
                const b = Data.pokemon(k);
                return `<option value="${k}" ${k === p.species ? 'selected' : ''}>${b.es || k}</option>`;
              }).join('')}
            </select></div>
          <div class="field"><label>Nivel</label>
            <input id="pd-lvl" type="number" min="1" max="100" value="${p.level}"></div>
          <div class="field"><label>Naturaleza</label>
            <select id="pd-nat"></select></div>
        </div>

        <h3>Estadísticas</h3>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${stats.hp}</span><small>base ${base.hp}</small></div>
          <div class="stat"><b>Ataque</b><span>${stats.atk}</span><small>base ${base.atk}</small></div>
          <div class="stat"><b>Defensa</b><span>${stats.def}</span><small>base ${base.def}</small></div>
          <div class="stat"><b>At. Esp.</b><span>${stats.spa}</span><small>base ${base.spa}</small></div>
          <div class="stat"><b>Def. Esp.</b><span>${stats.spd}</span><small>base ${base.spd}</small></div>
          <div class="stat"><b>Velocidad</b><span>${stats.spe}</span><small>base ${base.spe}</small></div>
        </div>

        <h3>Reparto de puntos</h3>
        <p class="count" id="pd-ptot"></p>
        <div class="row">
          ${['hp','atk','def','spa','spd','spe'].map(k => `
            <div class="field"><label>${({hp:'Salud',atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'})[k]} (+)</label>
              <input data-pk2="${k}" type="number" min="0" value="${p.points[k] || 0}"></div>
          `).join('')}
        </div>

        <h3>Estado actual</h3>
        <div class="row wide">
          <div class="field"><label>PG actuales (máx. ${pgMax})</label>
            <input id="pd-hp" type="number" min="0" max="${pgMax}" value="${pgNow}">
            <div style="display:flex;gap:6px;margin-top:6px">
              <button class="btn ghost xs" id="pd-full">Llenar</button>
              <button class="btn ghost xs" id="pd--10">−10</button>
              <button class="btn ghost xs" id="pd-+10">+10</button>
            </div>
          </div>
          <div class="field"><label>Heridas</label>
            <input id="pd-her" type="number" min="0" value="${p.heridas || 0}"></div>
          <div class="field"><label>EXP</label>
            <input id="pd-exp" type="number" min="0" value="${p.exp || 0}"></div>
        </div>

        <h3>Habilidad</h3>
        <div class="field"><input id="pd-hab" value="${p.ability || ''}" placeholder="Ej. Fotosíntesis"></div>

        <h3>Movimientos</h3>
        <div class="field">
          <textarea id="pd-movs" rows="4" placeholder="Uno por línea, máx. 6">${p.moves || ''}</textarea>
          <div class="moves-list" id="pd-movs-info"></div>
        </div>

        <h3>Notas</h3>
        <div class="field"><textarea id="pd-notes" rows="3">${p.notes || ''}</textarea></div>
      </div>`;

    // Naturalezas en el select
    const nat = el.querySelector('#pd-nat');
    const NATURES = ['— sin definir —','Adorable','Distraído','Orgulloso','Decidido','Paciente',
      'Desesperado','Solitario','Firme','Travieso','Valiente','Severo','Osado','Pícaro','Relajado',
      'Flemático','Curioso','Modesto','Apacible','Impulsivo','Callado','Soñador','Sereno','Amable',
      'Cuidadoso','Descarado','Asustadizo','Tímido','Apresurado','Alegre','Ingenuo',
      'Compuesto','Fuerte','Dócil','Excéntrico','Serio'];
    NATURES.forEach((n, i) => nat.appendChild(new Option(n, i)));
    nat.value = p.nature;

    // Listeners
    el.querySelector('#pk-back').addEventListener('click', () => this.showList());
    el.querySelector('#pk-del').addEventListener('click', () => this.remove(p.id));
    el.querySelector('#pk-activate')?.addEventListener('click', () => {
      this.setActive(p.id); this.showDetail(p.id);
    });

    el.querySelector('#pd-nick').addEventListener('input', e => { p.nickname = e.target.value; persist(); UI.updateChip(); });
    el.querySelector('#pd-esp').addEventListener('change', e => { p.species = e.target.value; persist(); this.showDetail(p.id); });
    el.querySelector('#pd-lvl').addEventListener('input', e => { p.level = Math.max(1, parseInt(e.target.value) || 1); persist(); this.showDetail(p.id); });
    el.querySelector('#pd-nat').addEventListener('change', e => { p.nature = parseInt(e.target.value); persist(); this.showDetail(p.id); });
    el.querySelector('#pd-hab').addEventListener('input', e => { p.ability = e.target.value; persist(); });
    el.querySelector('#pd-notes').addEventListener('input', e => { p.notes = e.target.value; persist(); });
    el.querySelector('#pd-her').addEventListener('input', e => { p.heridas = Math.max(0, parseInt(e.target.value) || 0); persist(); });
    el.querySelector('#pd-exp').addEventListener('input', e => { p.exp = Math.max(0, parseInt(e.target.value) || 0); persist(); });

    // Puntos
    const pts = [...el.querySelectorAll('[data-pk2]')];
    const tot = el.querySelector('#pd-ptot');
    const upd = () => {
      const max = p.level + 10;
      let used = 0;
      pts.forEach(inp => {
        const v = Math.max(0, parseInt(inp.value) || 0);
        inp.value = v; used += v;
        p.points[inp.dataset.pk2] = v;
      });
      tot.textContent = `${used} / ${max}`;
      tot.style.color = used === max ? 'var(--g)' : 'var(--r)';
      persist();
    };
    pts.forEach(i => i.addEventListener('input', upd));
    upd();

    // PG
    const hpIn = el.querySelector('#pd-hp');
    hpIn.addEventListener('change', () => {
      const v = Math.max(0, Math.min(pgMax, parseInt(hpIn.value) || 0));
      p.hpCurrent = v; persist();
    });
    el.querySelector('#pd-full').addEventListener('click', () => { p.hpCurrent = null; persist(); this.showDetail(p.id); });
    el.querySelector('#pd--10').addEventListener('click', () => {
      p.hpCurrent = Math.max(0, (p.hpCurrent ?? pgMax) - 10); persist(); this.showDetail(p.id);
    });
    el.querySelector('#pd-+10').addEventListener('click', () => {
      p.hpCurrent = Math.min(pgMax, (p.hpCurrent ?? pgMax) + 10); persist(); this.showDetail(p.id);
    });

    // Movimientos
    const movsIn = el.querySelector('#pd-movs');
    const movsInfo = el.querySelector('#pd-movs-info');
    const updMovs = () => {
      p.moves = movsIn.value; persist();
      const lines = movsIn.value.split('\n').map(l => l.trim()).filter(Boolean);
      movsInfo.innerHTML = lines.length ? lines.map(m => {
        const mv = Data.move(m);
        return mv
          ? `<div class="move-row"><span>${m}</span><span class="mdb">DB ${mv.db} · AC ${mv.ac ?? '—'}</span><span class="tag">${mv.type}</span><span class="tag">${mv.class}</span></div>`
          : `<div class="move-row"><span>${m}</span><span class="move-warn">desconocido</span></div>`;
      }).join('') : '';
    };
    movsIn.addEventListener('input', updMovs);
    updMovs();
  },

  /** Stats finales de un Pokémon (base + naturaleza + puntos). */
  _stats(p) {
    const base = Data.pokemon(p.species);
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
    const nat = NATURES[p.nature];
    const out = {};
    ['hp','atk','def','spa','spd','spe'].forEach(k => {
      let v = base[k];
      if (nat) {
        if (nat.up === k) v += (k === 'hp' ? 1 : 2);
        if (nat.dn === k) v -= (k === 'hp' ? 1 : 2);
      }
      v += p.points[k] || 0;
      out[k] = Math.max(1, v);
    });
    return out;
  }
};