/* ============================================================
   pokemon.js · Lista y detalle de Pokémon
   Fix: querySelector con '+' inválido → getElementById.
   Fix: escape de campos de texto importados.
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
    const esc = Utils.escapeHtml;

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
    const esc = Utils.escapeHtml;
    const stats = this._stats(p);
    const pgMax = p.level + stats.hp * 3 + 10;
    const pgNow = p.hpCurrent === null ? pgMax : p.hpCurrent;
    const pct = pgMax ? Math.max(0, Math.min(100, (pgNow / pgMax) * 100)) : 0;
    const cls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
    const active = p.id === State.activePokemonId;

    return `
      <div class="pokemon-card ${active ? 'active' : ''}" data-pkid="${esc(p.id)}">
        <div class="pc-head">
          <div>
            <div class="pc-name">${esc(p.nickname || base.es || p.species)}${active ? ' <span class="tag g">activo</span>' : ''}</div>
            <div style="font-size:12px;color:var(--dim)">Nv. ${esc(p.level)}</div>
          </div>
        </div>
        <div class="pc-types">${base.t.map(t => `<span class="tag" data-type="${esc(t)}">${esc(t)}</span>`).join('')}</div>
        <div class="hpbar ${cls}"><i style="width:${pct}%"></i></div>
        <div class="pc-stats">
          <span>PG ${esc(pgNow)}/${esc(pgMax)}</span>
          <span>Atq ${esc(stats.atk)}</span>
          <span>Def ${esc(stats.def)}</span>
          <span>Vel ${esc(stats.spe)}</span>
          ${p.heridas ? `<span style="color:var(--r)">Heridas: ${esc(p.heridas)}</span>` : ''}
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
    const esc = Utils.escapeHtml;

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
          <div class="field"><label>Apodo (opcional)</label>
            <input id="pd-nick" value="${esc(p.nickname || '')}" placeholder="${esc(base.es || p.species)}"></div>
          <div class="field"><label>Especie</label>
            <select id="pd-esp">
              ${Data.pokemonKeys().map(k => {
                const b = Data.pokemon(k);
                return `<option value="${esc(k)}" ${k === p.species ? 'selected' : ''}>${esc(b.es || k)}</option>`;
              }).join('')}
            </select></div>
          <div class="field"><label>Nivel</label>
            <input id="pd-lvl" type="number" min="1" max="100" value="${esc(p.level)}"></div>
          <div class="field"><label>Naturaleza</label>
            <select id="pd-nat"></select></div>
        </div>

        <h3>Estadísticas</h3>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${esc(stats.hp)}</span><small>base ${esc(base.hp)}</small></div>
          <div class="stat"><b>Ataque</b><span>${esc(stats.atk)}</span><small>base ${esc(base.atk)}</small></div>
          <div class="stat"><b>Defensa</b><span>${esc(stats.def)}</span><small>base ${esc(base.def)}</small></div>
          <div class="stat"><b>At. Esp.</b><span>${esc(stats.spa)}</span><small>base ${esc(base.spa)}</small></div>
          <div class="stat"><b>Def. Esp.</b><span>${esc(stats.spd)}</span><small>base ${esc(base.spd)}</small></div>
          <div class="stat"><b>Velocidad</b><span>${esc(stats.spe)}</span><small>base ${esc(base.spe)}</small></div>
        </div>

        <h3>Reparto de puntos</h3>
        <p class="count" id="pd-ptot"></p>
        <div class="row">
          ${['hp','atk','def','spa','spd','spe'].map(k => `
            <div class="field"><label>${({hp:'Salud',atk:'Ataque',def:'Defensa',spa:'At. Esp.',spd:'Def. Esp.',spe:'Velocidad'})[k]} (+)</label>
              <input data-pk2="${esc(k)}" type="number" min="0" value="${esc(p.points[k] || 0)}"></div>
          `).join('')}
        </div>

        <h3>Estado actual</h3>
        <div class="row wide">
          <div class="field"><label>PG actuales (máx. ${esc(pgMax)})</label>
            <input id="pd-hp" type="number" min="0" max="${esc(pgMax)}" value="${esc(pgNow)}">
            <div style="display:flex;gap:6px;margin-top:6px">
              <button class="btn ghost xs" id="pd-full">Llenar</button>
              <button class="btn ghost xs" id="pd-hp-menos10">−10</button>
              <button class="btn ghost xs" id="pd-hp-mas10">+10</button>
            </div>
          </div>
          <div class="field"><label>Heridas</label>
            <input id="pd-her" type="number" min="0" value="${esc(p.heridas || 0)}"></div>
          <div class="field"><label>EXP</label>
            <input id="pd-exp" type="number" min="0" value="${esc(p.exp || 0)}"></div>
        </div>

        <h3>Habilidad</h3>
        <div class="field">
          <select id="pd-hab"></select>
          <div id="pd-hab-info" style="font-size:12.5px;color:var(--dim);margin-top:6px;line-height:1.5"></div>
        </div>

        <h3>Movimientos <span style="font-size:12px;color:var(--dim);font-weight:400">(máx. 6)</span></h3>
        <div id="pd-movs-selector"></div>

        <h3>Notas</h3>
        <div class="field"><textarea id="pd-notes" rows="3" placeholder="Opcional.">${esc(p.notes || '')}</textarea></div>
      </div>`;

    const nat = el.querySelector('#pd-nat');
    const NATURES = ['— sin definir —','Adorable','Distraído','Orgulloso','Decidido','Paciente',
      'Desesperado','Solitario','Firme','Travieso','Valiente','Severo','Osado','Pícaro','Relajado',
      'Flemático','Curioso','Modesto','Apacible','Impulsivo','Callado','Soñador','Sereno','Amable',
      'Cuidadoso','Descarado','Asustadizo','Tímido','Apresurado','Alegre','Ingenuo',
      'Compuesto','Fuerte','Dócil','Excéntrico','Serio'];
    NATURES.forEach((n, i) => nat.appendChild(new Option(n, i)));
    nat.value = p.nature;

    el.querySelector('#pk-back').addEventListener('click', () => this.showList());
    el.querySelector('#pk-del').addEventListener('click', () => this.remove(p.id));
    el.querySelector('#pk-activate')?.addEventListener('click', () => {
      this.setActive(p.id); this.showDetail(p.id);
    });

    el.querySelector('#pd-nick').addEventListener('input', e => { p.nickname = e.target.value; persist(); UI.updateChip(); });
    el.querySelector('#pd-esp').addEventListener('change', e => { p.species = e.target.value; p.moves = ''; persist(); this.showDetail(p.id); });
    el.querySelector('#pd-lvl').addEventListener('input', e => {
      const v = Math.max(1, parseInt(e.target.value) || 1);
      p.level = v; persist();
      // Solo actualizamos los derivados, no reconstruimos el DOM
      this._refreshDerived(p);
    });
    el.querySelector('#pd-nat').addEventListener('change', e => { p.nature = parseInt(e.target.value); persist(); this.showDetail(p.id); });
    el.querySelector('#pd-notes').addEventListener('input', e => { p.notes = e.target.value; persist(); });
    el.querySelector('#pd-her').addEventListener('input', e => { p.heridas = Math.max(0, parseInt(e.target.value) || 0); persist(); });
    el.querySelector('#pd-exp').addEventListener('input', e => { p.exp = Math.max(0, parseInt(e.target.value) || 0); persist(); });

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
      // Refrescar derivados sin reconstruir
      this._refreshDerived(p);
      persist();
    };
    pts.forEach(i => i.addEventListener('input', upd));
    upd();

    const hpIn = el.querySelector('#pd-hp');
    hpIn.addEventListener('change', () => {
      const v = Math.max(0, Math.min(pgMax, parseInt(hpIn.value) || 0));
      p.hpCurrent = v; persist();
    });

    // ✅ SELECTORES CORREGIDOS: por ID, no por querySelector con '+'
    el.querySelector('#pd-full').addEventListener('click', () => { p.hpCurrent = null; persist(); this.showDetail(p.id); });
    el.querySelector('#pd-hp-menos10').addEventListener('click', () => {
      p.hpCurrent = Math.max(0, (p.hpCurrent ?? pgMax) - 10); persist(); this.showDetail(p.id);
    });
    el.querySelector('#pd-hp-mas10').addEventListener('click', () => {
      p.hpCurrent = Math.min(pgMax, (p.hpCurrent ?? pgMax) + 10); persist(); this.showDetail(p.id);
    });

    this._renderAbilitySelector(p, base);
    this._renderMovesSelector(p, base);
  },

  /** Refresca solo las partes derivadas sin reconstruir todo el DOM (no pierde foco). */
  _refreshDerived(p) {
    const el = document.getElementById('pokemonDetailView');
    if (!el) return;
    const base = Data.pokemon(p.species);
    if (!base) return;

    const stats = this._stats(p);
    const pgMax = p.level + stats.hp * 3 + 10;

    // Actualizar las 6 stat cards
    const statValues = el.querySelectorAll('.stats .stat span');
    const keys = ['hp','atk','def','spa','spd','spe'];
    if (statValues.length >= 6) {
      keys.forEach((k, i) => { if (statValues[i]) statValues[i].textContent = stats[k]; });
    }

    // Actualizar contador de puntos
    const max = p.level + 10;
    let used = 0;
    el.querySelectorAll('[data-pk2]').forEach(inp => {
      used += parseInt(inp.value) || 0;
    });
    const tot = el.querySelector('#pd-ptot');
    if (tot) {
      tot.textContent = `${used} / ${max}`;
      tot.style.color = used === max ? 'var(--g)' : 'var(--r)';
    }

    // Actualizar label de PG
    const hpLabel = el.querySelector('#pd-hp')?.closest('.field')?.querySelector('label');
    if (hpLabel) hpLabel.textContent = `PG actuales (máx. ${pgMax})`;
  },

  _renderAbilitySelector(p, base) {
    const sel = document.getElementById('pd-hab');
    const info = document.getElementById('pd-hab-info');
    if (!sel) return;
    const esc = Utils.escapeHtml;
    sel.innerHTML = '';
    sel.appendChild(new Option('— sin elegir —', ''));

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
        const ab = Data.abilities[h];
        const txt = ab ? `${h} — ${ab.desc}` : h;
        og.appendChild(new Option(txt, h));
      });
      sel.appendChild(og);
    });
    sel.value = p.ability || '';

    const updInfo = () => {
      const ab = Data.abilities[sel.value];
      info.textContent = ab ? ab.full : '';
    };
    sel.addEventListener('change', () => {
      p.ability = sel.value;
      persist();
      updInfo();
    });
    updInfo();
  },

  _renderMovesSelector(p, base) {
    const box = document.getElementById('pd-movs-selector');
    if (!box) return;
    const esc = Utils.escapeHtml;

    const current = (p.moves || '').split('\n').map(l => l.trim()).filter(Boolean);
    const learned = (base.moves?.level || [])
      .filter(m => m.lvl <= p.level)
      .sort((a, b) => a.lvl - b.lvl);

    if (!learned.length) {
      box.innerHTML = '<p style="color:var(--dim);font-size:13px">Este Pokémon no tiene movimientos disponibles al nivel ' + esc(p.level) + '.</p>';
      return;
    }

    box.innerHTML = `
      <p style="font-size:12.5px;color:var(--dim);margin:0 0 6px">
        Marca hasta <b>6</b>. Llevas <span id="pd-movs-count">${current.length}</span>/6.
      </p>
      <div class="chk-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
        ${learned.map(m => {
          const mv = Data.move(m.name);
          const isChecked = current.includes(m.name);
          const dbTxt = mv ? `DB ${mv.db}` : '—';
          const acTxt = mv ? `AC ${mv.ac ?? '—'}` : '';
          const tipo = mv ? mv.type : (m.t || '');
          const clase = mv ? mv.class : '';
          return `<label title="${esc(mv?.effect || '')}">
            <input type="checkbox" data-move="${esc(m.name)}" ${isChecked ? 'checked' : ''}>
            <span>
              <b>${esc(m.name)}</b>
              <br><small style="color:var(--dim)">Nv.${esc(m.lvl)} · ${esc(dbTxt)} · ${esc(acTxt)} · ${esc(tipo)}${clase ? ' · ' + esc(clase) : ''}</small>
            </span>
          </label>`;
        }).join('')}
      </div>`;

    box.querySelectorAll('input[data-move]').forEach(cb => {
      cb.addEventListener('change', () => {
        const sel = [...box.querySelectorAll('input[data-move]:checked')].map(c => c.dataset.move);
        if (sel.length > 6) { cb.checked = false; return; }
        p.moves = sel.join('\n');
        const c = document.getElementById('pd-movs-count');
        if (c) c.textContent = sel.length;
        persist();
      });
    });
  },

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
