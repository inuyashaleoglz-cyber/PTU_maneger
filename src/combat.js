/* ============================================================
   combat.js · Tracker de iniciativa y PG
   Fix: orden de turnos = orden mostrado (por iniciativa).
   Fix: toma PG actuales reales de la ficha, no máximos.
   Añade: botón "Sincronizar a la ficha" para aplicar cambios.
   Añade: preserva el combatiente activo al añadir/quitar.
   ============================================================ */
'use strict';

const Combat = {
  STATES: ['Quemado','Envenenado','Grave','Paralizado','Congelado','Dormido','Confuso','Retroceso','Enfurecido','Enamorado','Anulado','Maldito','Suprimido'],

  init() {
    document.getElementById('cb-add').addEventListener('click', () => this.add());
    document.getElementById('cb-add-me').addEventListener('click', () => this.addMe());
    document.getElementById('cb-add-team').addEventListener('click', () => this.addTeam());
    document.getElementById('cb-next').addEventListener('click', () => this.next());
    document.getElementById('cb-clear').addEventListener('click', () => {
      if (!confirm('¿Vaciar el combate?')) return;
      State.combat = { list: [], round: 1, currentIndex: 0 };
      persist(); this.render();
    });
    document.getElementById('cb-sync')?.addEventListener('click', () => this.syncToSheet());
  },

  add() {
    const name = document.getElementById('cb-name').value.trim() || 'Combatiente';
    const init = parseInt(document.getElementById('cb-init').value) || 0;
    const hp = parseInt(document.getElementById('cb-hp').value) || 1;
    const ap = parseInt(document.getElementById('cb-ap').value) || 0;
    const side = document.getElementById('cb-side').value;
    this._push(name, init, hp, ap, side);
    document.getElementById('cb-name').value = '';
  },

  addMe() {
    const t = State.trainer;
    if (!t.name) { alert('Primero crea tu entrenador.'); return; }
    const pgMax = t.level * 2 + t.stats.hp * 3 + 10;
    const pa = 5 + Math.floor(t.level / 5);
    // El entrenador no tiene PG "actual" separado en la ficha, así que usamos el máximo
    this._push(t.name, t.stats.spe, pgMax, pa, 'ally', {
      sourceKind: 'trainer',
      sourceId: 'trainer'
    });
  },

  addTeam() {
    State.pokemons.forEach(p => {
      const base = Data.pokemon(p.species);
      if (!base) return;
      const stats = Pokemon._stats(p);
      const pgMax = p.level + stats.hp * 3 + 10;
      // ✅ FIX: usar PG actuales reales, no máximos
      const pgNow = (p.hpCurrent === null || p.hpCurrent === undefined) ? pgMax : p.hpCurrent;
      this._push(p.nickname || base.es || p.species, stats.spe, pgMax, 0, 'ally', {
        sourceKind: 'pokemon',
        sourceId: p.id,
        hpInitial: pgNow
      });
    });
  },

  _push(name, init, hpMax, apMax, side, extra = {}) {
    const cb = {
      id: Utils.uid(),
      name,
      init,
      hp: extra.hpInitial !== undefined ? extra.hpInitial : hpMax,
      hpMax,
      ap: apMax,
      apMax,
      side,
      states: [],
      usedStd: false,
      usedMove: false,
      usedSwift: false,
      sourceKind: extra.sourceKind || null,
      sourceId: extra.sourceId || null
    };
    State.combat.list.push(cb);
    persist(); this.render();
  },

  /** Devuelve la lista ordenada por iniciativa descendente. */
  _sortedList() {
    return State.combat.list
      .map((x, i) => ({ cb: x, origIdx: i }))
      .sort((a, b) => {
        if (b.cb.init !== a.cb.init) return b.cb.init - a.cb.init;
        // Desempate estable: mantener orden de inserción
        return a.origIdx - b.origIdx;
      });
  },

  next() {
    const c = State.combat;
    if (!c.list.length) return;

    // ✅ Orden por iniciativa, no por índice en array
    const sorted = this._sortedList();
    if (!sorted.length) return;

    // Encontrar la posición actual dentro del orden por iniciativa
    const curId = c.list[c.currentIndex]?.id;
    let posInSorted = sorted.findIndex(s => s.cb.id === curId);
    if (posInSorted === -1) posInSorted = -1;

    // Avanzar al siguiente en el orden por iniciativa
    let nextPos = posInSorted + 1;
    if (nextPos >= sorted.length) {
      nextPos = 0;
      c.round++;
    }

    const nextCb = sorted[nextPos].cb;
    // Encontrar su índice real en el array
    const realIdx = c.list.findIndex(x => x.id === nextCb.id);
    if (realIdx !== -1) c.currentIndex = realIdx;

    // Limpiar acciones del nuevo turno
    nextCb.usedStd = false;
    nextCb.usedMove = false;
    nextCb.usedSwift = false;

    persist(); this.render();
  },

  render() {
    const c = State.combat;
    const list = document.getElementById('combatList');
    const empty = document.getElementById('combatEmpty');
    if (!list) return;

    document.getElementById('cb-round').textContent = c.round;
    const cur = c.list[c.currentIndex];
    document.getElementById('cb-current').textContent = cur ? cur.name : '—';

    empty.classList.toggle('hide', c.list.length > 0);
    list.innerHTML = '';

    // ✅ Orden por iniciativa
    const sorted = this._sortedList();
    const esc = Utils.escapeHtml;

    sorted.forEach(({ cb, origIdx }) => {
      const pct = cb.hpMax ? Math.max(0, Math.min(100, (cb.hp / cb.hpMax) * 100)) : 0;
      const hpCls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
      const isActive = origIdx === c.currentIndex;
      const isDown = cb.hp <= 0;

      const sideLabel = cb.side === 'enemy' ? 'Enemigo' : cb.side === 'ally' ? 'Aliado' : 'Neutral';
      const sideCls = cb.side === 'enemy' ? 'r' : cb.side === 'ally' ? 'g' : '';

      const row = document.createElement('div');
      row.className = `combat-row${isActive ? ' active' : ''}${isDown ? ' down' : ''}`;
      row.innerHTML = `
        <div class="combat-head">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="combat-name">${esc(cb.name)}</span>
            <span class="combat-init">Init ${esc(cb.init)}</span>
            <span class="tag ${sideCls}">${sideLabel}</span>
            ${cb.sourceKind === 'pokemon' ? '<span class="tag b" title="Vinculado a un Pokémon de tu ficha">🐾 vinculado</span>' : ''}
            ${cb.sourceKind === 'trainer' ? '<span class="tag p" title="Vinculado a tu entrenador">👤 vinculado</span>' : ''}
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <button class="btn ghost xs" data-idx="${origIdx}" data-a="dmg">−5 PG</button>
            <button class="btn ghost xs" data-idx="${origIdx}" data-a="heal">+5 PG</button>
            <button class="btn ghost xs" data-idx="${origIdx}" data-a="focus" title="Marcar como turno actual">🎯</button>
            <button class="btn r xs" data-idx="${origIdx}" data-a="del">✕</button>
          </div>
        </div>
        <div class="hpbar ${hpCls}"><i style="width:${pct}%"></i></div>
        <div class="combat-controls">
          PG <input type="number" value="${esc(cb.hp)}" data-idx="${origIdx}" data-f="hp"> / ${esc(cb.hpMax)}
          · PA <input type="number" value="${esc(cb.ap)}" data-idx="${origIdx}" data-f="ap"> / ${esc(cb.apMax)}
        </div>
        <div class="actions-chk">
          <label><input type="checkbox" ${cb.usedStd ? 'checked' : ''} data-idx="${origIdx}" data-f="usedStd"> Estándar</label>
          <label><input type="checkbox" ${cb.usedMove ? 'checked' : ''} data-idx="${origIdx}" data-f="usedMove"> Movimiento</label>
          <label><input type="checkbox" ${cb.usedSwift ? 'checked' : ''} data-idx="${origIdx}" data-f="usedSwift"> Rápida</label>
        </div>
        <div class="state-chips">
          ${cb.states.map(s => `<span class="schip" data-idx="${origIdx}" data-s="${esc(s)}">${esc(s)} ✕</span>`).join('')}
          <select data-idx="${origIdx}" data-sel="1" class="schip add">
            <option value="">+ estado…</option>
            ${this.STATES.filter(s => !cb.states.includes(s)).map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
          </select>
        </div>`;
      list.appendChild(row);
    });

    // Listeners de inputs numéricos
    list.querySelectorAll('input[type=number]').forEach(inp => {
      inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.idx), f = inp.dataset.f;
        let v = parseInt(inp.value) || 0;
        const cb = State.combat.list[i];
        if (f === 'hp') v = Math.max(0, Math.min(cb.hpMax, v));
        if (f === 'ap') v = Math.max(0, Math.min(cb.apMax, v));
        cb[f] = v; persist(); this.render();
      });
    });

    // Checkboxes
    list.querySelectorAll('input[type=checkbox]').forEach(inp => {
      inp.addEventListener('change', () => {
        State.combat.list[parseInt(inp.dataset.idx)][inp.dataset.f] = inp.checked;
        persist();
      });
    });

    // Chips de estado
    list.querySelectorAll('.schip:not(.add)').forEach(chip => {
      chip.addEventListener('click', () => {
        const i = parseInt(chip.dataset.idx);
        State.combat.list[i].states = State.combat.list[i].states.filter(s => s !== chip.dataset.s);
        persist(); this.render();
      });
    });

    // Añadir estado
    list.querySelectorAll('select[data-sel]').forEach(sel => {
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        State.combat.list[parseInt(sel.dataset.idx)].states.push(sel.value);
        persist(); this.render();
      });
    });

    // Botones de acción
    list.querySelectorAll('button[data-a]').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.idx), a = b.dataset.a, cb = State.combat.list[i];
        if (a === 'dmg') cb.hp = Math.max(0, cb.hp - 5);
        else if (a === 'heal') cb.hp = Math.min(cb.hpMax, cb.hp + 5);
        else if (a === 'focus') State.combat.currentIndex = i;
        else if (a === 'del') {
          State.combat.list.splice(i, 1);
          if (State.combat.currentIndex >= State.combat.list.length) State.combat.currentIndex = 0;
        }
        persist(); this.render();
      });
    });
  },

  /** Aplica los PG actuales del combate de vuelta a las fichas vinculadas. */
  syncToSheet() {
    const list = State.combat.list.filter(cb => cb.sourceKind === 'pokemon' && cb.sourceId);
    if (!list.length) {
      alert('No hay Pokémon vinculados en el combate para sincronizar.');
      return;
    }
    const nombres = list.map(cb => cb.name).join(', ');
    if (!confirm(`Se aplicarán los PG actuales del combate a ${list.length} Pokémon:\n\n${nombres}\n\n¿Continuar?`)) return;

    list.forEach(cb => {
      const p = State.pokemons.find(x => x.id === cb.sourceId);
      if (!p) return;
      const stats = Pokemon._stats(p);
      const pgMax = p.level + stats.hp * 3 + 10;
      const clamped = Math.max(0, Math.min(pgMax, cb.hp));
      p.hpCurrent = clamped === pgMax ? null : clamped;
    });

    persist();
    UI.updateChip();
    alert('PG actualizados en las fichas.');
  }
};
