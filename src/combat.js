/* ============================================================
   combat.js · Tracker de iniciativa + frecuencias de movimientos
   Añade: contador de usos por movimiento según su frecuencia.
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
    document.getElementById('cb-rest-scene')?.addEventListener('click', () => this._resetFreq('scene'));
    document.getElementById('cb-rest-day')?.addEventListener('click', () => this._resetFreq('day'));
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
      const pgNow = (p.hpCurrent === null || p.hpCurrent === undefined) ? pgMax : p.hpCurrent;
      this._push(p.nickname || base.es || p.species, stats.spe, pgMax, 0, 'ally', {
        sourceKind: 'pokemon',
        sourceId: p.id,
        hpInitial: pgNow,
        moves: (p.moves || '').split('\n').filter(Boolean)
      });
    });
  },

  _push(name, init, hpMax, apMax, side, extra = {}) {
    // Preparar datos de movimientos con frecuencias
    const movesData = (extra.moves || []).map(mName => {
      const mv = Data.move(mName);
      const freq = mv?.freq || 'At-Will';
      return {
        name: mName,
        freq,
        usesLeft: this._initialUses(freq),
        maxUses: this._initialUses(freq)
      };
    }).filter(m => m.name);

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
      sourceId: extra.sourceId || null,
      movesData: movesData
    };
    State.combat.list.push(cb);
    persist(); this.render();
  },

  /** Devuelve los usos iniciales según la frecuencia. */
  _initialUses(freq) {
    if (!freq) return null; // ilimitado
    const f = String(freq).toLowerCase();
    if (f.includes('at-will')) return null;
    if (f.includes('eot')) return 1;
    if (f.includes('scene x2') || f.includes('scene 2')) return 2;
    if (f.includes('scene')) return 1;
    if (f.includes('daily')) return 1;
    return null;
  },

  /** Reinicia las frecuencias del tipo indicado. */
  _resetFreq(kind) {
    State.combat.list.forEach(cb => {
      if (!cb.movesData) return;
      cb.movesData.forEach(mv => {
        const f = String(mv.freq || '').toLowerCase();
        if (kind === 'scene' && f.includes('scene')) {
          mv.usesLeft = mv.maxUses;
        } else if (kind === 'day' && (f.includes('daily') || f.includes('scene') || f.includes('eot'))) {
          mv.usesLeft = mv.maxUses;
        }
      });
    });
    persist(); this.render();
  },

  _sortedList() {
    return State.combat.list
      .map((x, i) => ({ cb: x, origIdx: i }))
      .sort((a, b) => {
        if (b.cb.init !== a.cb.init) return b.cb.init - a.cb.init;
        return a.origIdx - b.origIdx;
      });
  },

  next() {
    const c = State.combat;
    if (!c.list.length) return;

    const sorted = this._sortedList();
    if (!sorted.length) return;

    const curId = c.list[c.currentIndex]?.id;
    let posInSorted = sorted.findIndex(s => s.cb.id === curId);
    if (posInSorted === -1) posInSorted = -1;

    let nextPos = posInSorted + 1;
    if (nextPos >= sorted.length) {
      nextPos = 0;
      c.round++;
    }

    const nextCb = sorted[nextPos].cb;
    const realIdx = c.list.findIndex(x => x.id === nextCb.id);
    if (realIdx !== -1) c.currentIndex = realIdx;

    nextCb.usedStd = false;
    nextCb.usedMove = false;
    nextCb.usedSwift = false;

    // EOT se recupera al empezar el turno del propio combatiente
    if (nextCb.movesData) {
      nextCb.movesData.forEach(mv => {
        if (String(mv.freq || '').toLowerCase().includes('eot')) {
          mv.usesLeft = mv.maxUses;
        }
      });
    }

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

    const sorted = this._sortedList();
    const esc = Utils.escapeHtml;

    sorted.forEach(({ cb, origIdx }) => {
      const pct = cb.hpMax ? Math.max(0, Math.min(100, (cb.hp / cb.hpMax) * 100)) : 0;
      const hpCls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
      const isActive = origIdx === c.currentIndex;
      const isDown = cb.hp <= 0;

      const sideLabel = cb.side === 'enemy' ? 'Enemigo' : cb.side === 'ally' ? 'Aliado' : 'Neutral';
      const sideCls = cb.side === 'enemy' ? 'r' : cb.side === 'ally' ? 'g' : '';

      // Bloque de movimientos con frecuencias
      let movesBlock = '';
      if (cb.movesData && cb.movesData.length) {
        movesBlock = `<div class="moves-tracker">${
          cb.movesData.map((mv, mi) => {
            const unlimited = mv.maxUses === null;
            const used = unlimited ? false : mv.usesLeft <= 0;
            const freqLabel = unlimited ? '∞' : `${mv.usesLeft}/${mv.maxUses}`;
            const freqCls = unlimited ? '' : (mv.usesLeft <= 0 ? 'out' : (mv.usesLeft === 1 ? 'last' : ''));
            return `<button class="move-tracker-chip ${freqCls}" data-idx="${origIdx}" data-mi="${mi}" title="${esc(mv.name)} (${esc(mv.freq)})" ${used ? 'disabled' : ''}>
              ${esc(mv.name)}
              <span class="freq">${freqLabel}</span>
            </button>`;
          }).join('')
        }</div>`;
      }

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
        ${movesBlock}
        <div class="state-chips">
          ${cb.states.map(s => `<span class="schip" data-idx="${origIdx}" data-s="${esc(s)}">${esc(s)} ✕</span>`).join('')}
          <select data-idx="${origIdx}" data-sel="1" class="schip add">
            <option value="">+ estado…</option>
            ${this.STATES.filter(s => !cb.states.includes(s)).map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
          </select>
        </div>`;
      list.appendChild(row);
    });

    // Listeners inputs
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

    list.querySelectorAll('select[data-sel]').forEach(sel => {
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        State.combat.list[parseInt(sel.dataset.idx)].states.push(sel.value);
        persist(); this.render();
      });
    });

    // Movimientos: gastar uso al hacer clic
    list.querySelectorAll('.move-tracker-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const i = parseInt(chip.dataset.idx);
        const mi = parseInt(chip.dataset.mi);
        const cb = State.combat.list[i];
        const mv = cb.movesData?.[mi];
        if (!mv) return;
        if (mv.maxUses === null) {
          // Sin límite: solo parpadeo visual
          chip.classList.add('used');
          setTimeout(() => chip.classList.remove('used'), 300);
          return;
        }
        if (mv.usesLeft <= 0) return;
        mv.usesLeft--;
        persist();
        this.render();
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
