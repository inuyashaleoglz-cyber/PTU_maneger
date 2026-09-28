/* ============================================================
   combat.js · Tracker de combate rediseñado
   - Panel de turno actual con acciones claras
   - Fila de iniciativa visual
   - Agrupación Aliados / Enemigos
   - Botones grandes para acciones comunes
   - Movimientos con usos y tooltips
   ============================================================ */
'use strict';

const Combat = {
  STATES: ['Quemado','Envenenado','Grave','Paralizado','Congelado','Dormido','Confuso','Retroceso','Enfurecido','Enamorado','Anulado','Maldito','Suprimido'],

  init() {
    document.getElementById('cb-add')?.addEventListener('click', () => this.add());
    document.getElementById('cb-add-me')?.addEventListener('click', () => this.addMe());
    document.getElementById('cb-add-team')?.addEventListener('click', () => this.addTeam());
    document.getElementById('cb-clear')?.addEventListener('click', () => {
      if (!confirm('¿Vaciar el combate? No se puede deshacer.')) return;
      State.combat = { list: [], round: 1, currentIndex: 0 };
      persist(); this.render();
    });
    document.getElementById('cb-sync')?.addEventListener('click', () => this.syncToSheet());
    document.getElementById('cb-rest-scene')?.addEventListener('click', () => this._resetFreq('scene'));
    document.getElementById('cb-rest-day')?.addEventListener('click', () => this._resetFreq('day'));
  },

  /* ============================================================
     AÑADIR COMBATIENTES
     ============================================================ */
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
    if (!State.pokemons.length) {
      alert('No tienes Pokémon en tu equipo.');
      return;
    }
    let added = 0;
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
      added++;
    });
    if (added === 0) alert('No se pudo añadir ningún Pokémon.');
  },

  _push(name, init, hpMax, apMax, side, extra = {}) {
    const movesData = (extra.moves || []).map(mName => {
      const mv = Data.move(mName);
      const freq = mv?.freq || 'At-Will';
      return {
        name: mName,
        freq,
        db: mv?.db ?? null,
        ac: mv?.ac ?? null,
        type: mv?.type || null,
        effect: mv?.effect || '',
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
      movesData
    };
    State.combat.list.push(cb);
    persist(); this.render();
  },

  _initialUses(freq) {
    if (!freq) return null;
    const f = String(freq).toLowerCase();
    if (f.includes('at-will')) return null;
    if (f.includes('eot')) return 1;
    if (f.includes('scene x2') || f.includes('scene 2')) return 2;
    if (f.includes('scene')) return 1;
    if (f.includes('daily')) return 1;
    return null;
  },

  _resetFreq(kind) {
    State.combat.list.forEach(cb => {
      if (!cb.movesData) return;
      cb.movesData.forEach(mv => {
        const f = String(mv.freq || '').toLowerCase();
        if (kind === 'scene' && f.includes('scene')) mv.usesLeft = mv.maxUses;
        else if (kind === 'day') mv.usesLeft = mv.maxUses;
      });
    });
    persist(); this.render();
  },

  /* ============================================================
     ORDEN DE INICIATIVA
     ============================================================ */
  _sortedList() {
    return State.combat.list
      .map((x, i) => ({ cb: x, origIdx: i }))
      .sort((a, b) => {
        if (b.cb.init !== a.cb.init) return b.cb.init - a.cb.init;
        return a.origIdx - b.origIdx;
      });
  },

  _currentCombatant() {
    const c = State.combat;
    return c.list[c.currentIndex] || null;
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

    if (nextCb.movesData) {
      nextCb.movesData.forEach(mv => {
        if (String(mv.freq || '').toLowerCase().includes('eot')) {
          mv.usesLeft = mv.maxUses;
        }
      });
    }

    persist(); this.render();
  },

  _focus(idx) {
    State.combat.currentIndex = idx;
    persist(); this.render();
  },

  /* ============================================================
     RENDER
     ============================================================ */
  render() {
    this._renderTurnPanel();
    this._renderList();
  },

  /** Panel grande arriba con el turno actual. */
  _renderTurnPanel() {
    const el = document.getElementById('combatTurnPanel');
    if (!el) return;

    const c = State.combat;
    const esc = Utils.escapeHtml;

    if (!c.list.length) {
      el.innerHTML = `
        <div class="card" style="text-align:center;padding:32px 20px">
          <div style="font-size:48px;margin-bottom:12px">⚔️</div>
          <h2 style="margin:0 0 8px">Sin combate activo</h2>
          <p style="color:var(--dim);margin:0 0 6px">
            Cuando empiece un combate, añade combatientes abajo.
          </p>
          <p style="color:var(--dim2);font-size:13px;margin:0">
            Los combatientes actúan en orden de Iniciativa (su Velocidad). Cuando llegue tu turno,
            verás aquí qué puedes hacer.
          </p>
        </div>`;
      return;
    }

    const cur = this._currentCombatant();
    if (!cur) {
      el.innerHTML = '';
      return;
    }

    const isAlly = cur.side === 'ally';
    const isEnemy = cur.side === 'enemy';
    const sideLabel = isAlly ? 'Aliado' : isEnemy ? 'Enemigo' : 'Neutral';

    // Acciones disponibles
    const std = cur.usedStd;
    const mov = cur.usedMove;
    const swf = cur.usedSwift;

    const iniChips = this._sortedList().map(({ cb }, i) => {
      const isCur = cb.id === cur.id;
      const down = cb.hp <= 0;
      const cls = isCur ? 'cur' : down ? 'down' : '';
      return `<button class="init-chip ${cls}" data-cb-id="${esc(cb.id)}">
        <span class="init-num">${i + 1}°</span>
        <span class="init-name">${esc(cb.name)}</span>
        <span class="init-val">${esc(cb.init)}</span>
      </button>`;
    }).join('');

    const statesTags = cur.states.length
      ? cur.states.map(s => `<span class="tag r">${esc(s)}</span>`).join(' ')
      : '<span style="color:var(--dim2);font-size:12px">Sin estados</span>';

    el.innerHTML = `
      <div class="turn-panel ${isAlly ? 'ally' : isEnemy ? 'enemy' : ''}">
        <div class="turn-panel-header">
          <span class="turn-panel-lbl">⚔️ Turno actual · Ronda ${esc(c.round)}</span>
        </div>
        <div class="turn-panel-body">
          <div class="turn-panel-info">
            <div class="turn-name">
              ${esc(cur.name)}
              <span class="tag ${isAlly ? 'g' : isEnemy ? 'r' : ''}" style="margin-left:8px">${sideLabel}</span>
            </div>
            <div class="turn-meta">
              <span title="Iniciativa">🏃 Iniciativa ${esc(cur.init)}</span>
              <span title="Puntos de Golpe">❤️ ${esc(cur.hp)}/${esc(cur.hpMax)} PG</span>
              ${cur.apMax > 0 ? `<span title="Puntos de Acción">⚡ ${esc(cur.ap)}/${esc(cur.apMax)} PA</span>` : ''}
            </div>
            <div class="turn-states">
              <b style="font-size:12px;color:var(--dim)">Estados:</b> ${statesTags}
            </div>
          </div>

          <div class="turn-actions">
            <p style="font-size:12.5px;color:var(--dim);margin:0 0 8px">
              En este turno puede hacer <b>1 acción de cada tipo</b>. Marca las que use:
            </p>
            <div class="action-buttons">
              <button class="action-btn ${std ? 'used' : ''}" data-action="std" data-cb-id="${esc(cur.id)}">
                <span class="ab-icon">🎯</span>
                <span class="ab-lbl">Estándar</span>
                <span class="ab-hint">${std ? '✓ Usada' : 'Atacar, usar objeto…'}</span>
              </button>
              <button class="action-btn ${mov ? 'used' : ''}" data-action="move" data-cb-id="${esc(cur.id)}">
                <span class="ab-icon">🏃</span>
                <span class="ab-lbl">Movimiento</span>
                <span class="ab-hint">${mov ? '✓ Usada' : 'Desplazarse'}</span>
              </button>
              <button class="action-btn ${swf ? 'used' : ''}" data-action="swift" data-cb-id="${esc(cur.id)}">
                <span class="ab-icon">⚡</span>
                <span class="ab-lbl">Rápida</span>
                <span class="ab-hint">${swf ? '✓ Usada' : 'Orden corta'}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="init-row-wrapper">
          <div class="init-row-lbl">Orden de iniciativa</div>
          <div class="init-row">${iniChips}</div>
        </div>

        <div class="turn-panel-footer">
          <button class="btn" id="turn-next">▶ Siguiente turno</button>
          <button class="btn ghost" id="turn-jump-me">🎯 Es mi turno</button>
        </div>
      </div>`;

    // Eventos
    el.querySelector('#turn-next')?.addEventListener('click', () => this.next());
    el.querySelector('#turn-jump-me')?.addEventListener('click', () => {
      const me = State.combat.list.findIndex(x => x.sourceKind === 'trainer');
      if (me !== -1) this._focus(me);
    });

    el.querySelectorAll('.init-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.cbId;
        const idx = State.combat.list.findIndex(x => x.id === id);
        if (idx !== -1) this._focus(idx);
      });
    });

    el.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cbId;
        const action = btn.dataset.action;
        const cb = State.combat.list.find(x => x.id === id);
        if (!cb) return;
        if (action === 'std') cb.usedStd = !cb.usedStd;
        if (action === 'move') cb.usedMove = !cb.usedMove;
        if (action === 'swift') cb.usedSwift = !cb.usedSwift;
        persist(); this.render();
      });
    });
  },

  /** Lista de combatientes agrupada por bando. */
  _renderList() {
    const wrap = document.getElementById('combatList');
    const empty = document.getElementById('combatEmpty');
    if (!wrap) return;

    const c = State.combat;
    wrap.innerHTML = '';
    if (empty) empty.classList.toggle('hide', c.list.length > 0);
    if (!c.list.length) return;

    const sorted = this._sortedList();
    const cur = this._currentCombatant();

    const groups = {
      ally: { label: '🛡️ Aliados', items: [] },
      enemy: { label: '⚔️ Enemigos', items: [] },
      neutral: { label: '🔸 Neutrales', items: [] }
    };

    sorted.forEach(({ cb, origIdx }) => {
      (groups[cb.side] || groups.neutral).items.push({ cb, origIdx });
    });

    Object.entries(groups).forEach(([side, g]) => {
      if (!g.items.length) return;
      const sideCls = side === 'ally' ? 'ally' : side === 'enemy' ? 'enemy' : 'neutral';
      const section = document.createElement('div');
      section.className = 'combat-group';
      section.innerHTML = `
        <div class="combat-group-header ${sideCls}">
          <span>${g.label}</span>
          <span class="combat-group-count">${g.items.length}</span>
        </div>
        <div class="combat-group-body"></div>`;
      const body = section.querySelector('.combat-group-body');

      g.items.forEach(({ cb, origIdx }) => {
        body.appendChild(this._buildCard(cb, origIdx, cur));
      });

      wrap.appendChild(section);
    });

    this._bindCardEvents(wrap);
  },

  /** Construye la tarjeta de un combatiente. */
  _buildCard(cb, origIdx, cur) {
    const esc = Utils.escapeHtml;
    const pct = cb.hpMax ? Math.max(0, Math.min(100, (cb.hp / cb.hpMax) * 100)) : 0;
    const hpCls = pct < 25 ? 'crit' : pct < 60 ? 'low' : '';
    const isActive = cur && cur.id === cb.id;
    const isDown = cb.hp <= 0;

    const row = document.createElement('div');
    row.className = `combat-row${isActive ? ' active' : ''}${isDown ? ' down' : ''}`;
    row.dataset.cbId = cb.id;
    row.dataset.origIdx = origIdx;

    // Bloque de movimientos
    let movesBlock = '';
    if (cb.movesData && cb.movesData.length) {
      movesBlock = `
        <div class="moves-tracker">
          <div class="moves-tracker-lbl">Movimientos</div>
          <div class="moves-tracker-chips">
            ${cb.movesData.map((mv, mi) => {
              const unlimited = mv.maxUses === null;
              const out = !unlimited && mv.usesLeft <= 0;
              const last = !unlimited && mv.usesLeft === 1;
              const freqLabel = unlimited ? '∞' : `${mv.usesLeft}/${mv.maxUses}`;
              const cls = out ? 'out' : last ? 'last' : '';
              const dbTxt = mv.db !== null ? `DB ${mv.db}` : '';
              const acTxt = mv.ac !== null ? `AC ${mv.ac}` : '';
              const metaTxt = [dbTxt, acTxt].filter(Boolean).join(' · ');
              return `<button class="move-tracker-chip ${cls}" data-mi="${mi}" title="${esc(mv.effect || mv.name)}" ${out ? 'disabled' : ''}>
                <b>${esc(mv.name)}</b>
                ${metaTxt ? `<span class="mv-meta">${esc(metaTxt)}</span>` : ''}
                <span class="freq">${freqLabel}</span>
              </button>`;
            }).join('')}
          </div>
        </div>`;
    }

    row.innerHTML = `
      <div class="combat-card-header">
        <div class="combat-card-title">
          ${isActive ? '<span class="active-dot" title="Turno actual"></span>' : ''}
          <span class="combat-name">${esc(cb.name)}</span>
          <span class="combat-init" title="Iniciativa">🏃 ${esc(cb.init)}</span>
          ${cb.sourceKind === 'pokemon' ? '<span class="tag b" style="font-size:10px;padding:1px 6px">🐾 vinculado</span>' : ''}
          ${cb.sourceKind === 'trainer' ? '<span class="tag p" style="font-size:10px;padding:1px 6px">👤 vinculado</span>' : ''}
        </div>
        <div class="combat-card-actions">
          <button class="btn ghost xs" data-act="focus" title="Marcar como turno actual">🎯</button>
          <button class="btn r xs" data-act="del" title="Eliminar">✕</button>
        </div>
      </div>

      <div class="hp-row">
        <div class="hp-label">
          <span>PG</span>
          <input type="number" value="${esc(cb.hp)}" data-field="hp" min="0" max="${esc(cb.hpMax)}">
          <span class="hp-max">/ ${esc(cb.hpMax)}</span>
        </div>
        ${cb.apMax > 0 ? `
          <div class="hp-label">
            <span>PA</span>
            <input type="number" value="${esc(cb.ap)}" data-field="ap" min="0" max="${esc(cb.apMax)}">
            <span class="hp-max">/ ${esc(cb.apMax)}</span>
          </div>` : ''}
        <div class="hp-quick">
          <button class="btn ghost xs" data-act="dmg5">−5</button>
          <button class="btn ghost xs" data-act="dmg10">−10</button>
          <button class="btn ghost xs" data-act="heal5">+5</button>
          <button class="btn ghost xs" data-act="heal-full">Llenar</button>
        </div>
      </div>

      <div class="hpbar ${hpCls}"><i style="width:${pct}%"></i></div>

      ${movesBlock}

      <div class="combat-card-footer">
        <div class="states-inline">
          ${cb.states.map(s => `<span class="schip" data-state="${esc(s)}">${esc(s)} <span class="x">✕</span></span>`).join('')}
          <select class="schip add" data-add-state="1">
            <option value="">+ estado</option>
            ${this.STATES.filter(s => !cb.states.includes(s)).map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    return row;
  },

  /** Conecta los eventos de las tarjetas. */
  _bindCardEvents(wrap) {
    wrap.querySelectorAll('.combat-row').forEach(row => {
      const cbId = row.dataset.cbId;
      const cb = State.combat.list.find(x => x.id === cbId);
      if (!cb) return;

      // Inputs de PG y PA
      row.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('change', () => {
          const field = inp.dataset.field;
          let v = parseInt(inp.value) || 0;
          if (field === 'hp') v = Math.max(0, Math.min(cb.hpMax, v));
          if (field === 'ap') v = Math.max(0, Math.min(cb.apMax, v));
          cb[field] = v;
          persist(); this.render();
        });
      });

      // Acciones del header
      row.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = btn.dataset.act;
          const idx = State.combat.list.findIndex(x => x.id === cbId);
          if (act === 'focus') this._focus(idx);
          else if (act === 'del') {
            if (!confirm(`¿Quitar a ${cb.name} del combate?`)) return;
            State.combat.list.splice(idx, 1);
            if (State.combat.currentIndex >= State.combat.list.length) State.combat.currentIndex = 0;
            persist(); this.render();
          }
          else if (act === 'dmg5') { cb.hp = Math.max(0, cb.hp - 5); persist(); this.render(); }
          else if (act === 'dmg10') { cb.hp = Math.max(0, cb.hp - 10); persist(); this.render(); }
          else if (act === 'heal5') { cb.hp = Math.min(cb.hpMax, cb.hp + 5); persist(); this.render(); }
          else if (act === 'heal-full') { cb.hp = cb.hpMax; persist(); this.render(); }
        });
      });

      // Movimientos con frecuencias
      row.querySelectorAll('.move-tracker-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const mi = parseInt(chip.dataset.mi);
          const mv = cb.movesData?.[mi];
          if (!mv) return;
          if (mv.maxUses === null) {
            chip.classList.add('used');
            setTimeout(() => chip.classList.remove('used'), 300);
            return;
          }
          if (mv.usesLeft <= 0) return;
          mv.usesLeft--;
          persist(); this.render();
        });
      });

      // Estados
      row.querySelectorAll('.schip[data-state]').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const st = chip.dataset.state;
          cb.states = cb.states.filter(x => x !== st);
          persist(); this.render();
        });
      });

      row.querySelector('select[data-add-state]')?.addEventListener('change', (e) => {
        e.stopPropagation();
        if (!e.target.value) return;
        cb.states.push(e.target.value);
        persist(); this.render();
      });
    });
  },

  /* ============================================================
     SINCRONIZAR
     ============================================================ */
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
