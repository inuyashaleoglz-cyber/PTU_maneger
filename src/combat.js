/* ============================================================
   combat.js · Tracker de iniciativa y PG
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
    const pg = t.level * 2 + t.stats.hp * 3 + 10;
    const pa = 5 + Math.floor(t.level / 5);
    this._push(t.name, t.stats.spe, pg, pa, 'ally');
  },

  addTeam() {
    State.pokemons.forEach(p => {
      const base = Data.pokemon(p.species);
      if (!base) return;
      const stats = Pokemon._stats(p);
      const pg = p.level + stats.hp * 3 + 10;
      this._push(p.nickname || base.es || p.species, stats.spe, pg, 0, 'ally');
    });
  },

  _push(name, init, hp, ap, side) {
    State.combat.list.push({
      name, init, hp, hpMax: hp, ap, apMax: ap, side,
      states: [], usedStd: false, usedMove: false, usedSwift: false
    });
    persist(); this.render();
  },

  next() {
    const c = State.combat;
    if (!c.list.length) return;
    c.currentIndex++;
    if (c.currentIndex >= c.list.length) { c.currentIndex = 0; c.round++; }
    // Limpia acciones del que empieza
    const cur = c.list[c.currentIndex];
    if (cur) { cur.usedStd = false; cur.usedMove = false; cur.usedSwift = false; }
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

    // Orden visual por iniciativa (sin cambiar el orden real)
    const sorted = c.list.map((x, i) => ({ x, i })).sort((a, b) => b.x.init - a.x.init);

    sorted.forEach(({ x: cb, i: idx }) => {
      const pct = cb.hpMax ? Math.max(0, Math.min(100, (cb.hp / cb.hpMax) * 100)) : 0;
      const hpCls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
      const isActive = idx === c.currentIndex;
      const isDown = cb.hp <= 0;

      const row = document.createElement('div');
      row.className = `combat-row${isActive ? ' active' : ''}${isDown ? ' down' : ''}`;
      row.innerHTML = `
        <div class="combat-head">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="combat-name">${cb.name}</span>
            <span class="combat-init">Init ${cb.init}</span>
            <span class="tag ${cb.side === 'enemy' ? 'r' : cb.side === 'ally' ? 'g' : ''}">${cb.side}</span>
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn ghost xs" data-i="${idx}" data-a="dmg">−5 PG</button>
            <button class="btn ghost xs" data-i="${idx}" data-a="heal">+5 PG</button>
            <button class="btn r xs" data-i="${idx}" data-a="del">✕</button>
          </div>
        </div>
        <div class="hpbar ${hpCls}"><i style="width:${pct}%"></i></div>
        <div class="combat-controls">
          PG <input type="number" value="${cb.hp}" data-i="${idx}" data-f="hp"> / ${cb.hpMax}
          · PA <input type="number" value="${cb.ap}" data-i="${idx}" data-f="ap"> / ${cb.apMax}
        </div>
        <div class="actions-chk">
          <label><input type="checkbox" ${cb.usedStd ? 'checked' : ''} data-i="${idx}" data-f="usedStd"> Estándar</label>
          <label><input type="checkbox" ${cb.usedMove ? 'checked' : ''} data-i="${idx}" data-f="usedMove"> Movimiento</label>
          <label><input type="checkbox" ${cb.usedSwift ? 'checked' : ''} data-i="${idx}" data-f="usedSwift"> Rápida</label>
        </div>
        <div class="state-chips">
          ${cb.states.map(s => `<span class="schip" data-i="${idx}" data-s="${s}">${s} ✕</span>`).join('')}
          <select data-i="${idx}" data-sel="1" class="schip add">
            <option value="">+ estado…</option>
            ${this.STATES.filter(s => !cb.states.includes(s)).map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>`;
      list.appendChild(row);
    });

    // Listeners
    list.querySelectorAll('input[type=number]').forEach(inp => {
      inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.i), f = inp.dataset.f;
        let v = parseInt(inp.value) || 0;
        const cb = State.combat.list[i];
        if (f === 'hp') v = Math.max(0, Math.min(cb.hpMax, v));
        if (f === 'ap') v = Math.max(0, Math.min(cb.apMax, v));
        cb[f] = v; persist(); this.render();
      });
    });
    list.querySelectorAll('input[type=checkbox]').forEach(inp => {
      inp.addEventListener('change', () => {
        State.combat.list[parseInt(inp.dataset.i)][inp.dataset.f] = inp.checked;
        persist();
      });
    });
    list.querySelectorAll('.schip:not(.add)').forEach(chip => {
      chip.addEventListener('click', () => {
        const i = parseInt(chip.dataset.i);
        State.combat.list[i].states = State.combat.list[i].states.filter(s => s !== chip.dataset.s);
        persist(); this.render();
      });
    });
    list.querySelectorAll('select[data-sel]').forEach(sel => {
      sel.addEventListener('change', () => {
        if (!sel.value) return;
        State.combat.list[parseInt(sel.dataset.i)].states.push(sel.value);
        persist(); this.render();
      });
    });
    list.querySelectorAll('button[data-a]').forEach(b => {
      b.addEventListener('click', () => {
        const i = parseInt(b.dataset.i), a = b.dataset.a, cb = State.combat.list[i];
        if (a === 'dmg') cb.hp = Math.max(0, cb.hp - 5);
        else if (a === 'heal') cb.hp = Math.min(cb.hpMax, cb.hp + 5);
        else if (a === 'del') {
          State.combat.list.splice(i, 1);
          if (State.combat.currentIndex >= State.combat.list.length) State.combat.currentIndex = 0;
        }
        persist(); this.render();
      });
    });
  }
};