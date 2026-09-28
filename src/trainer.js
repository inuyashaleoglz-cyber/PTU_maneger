/* ============================================================
   trainer.js · Vista del entrenador + clases + notas + mochila
   Añade: campo de notas editable y mochila visual con "usar".
   ============================================================ */
'use strict';

const Trainer = {
  render() {
    const t = State.trainer;
    const el = document.getElementById('entrenadorView');
    if (!el) return;
    const esc = Utils.escapeHtml;

    if (!t.name) {
      el.innerHTML = `<div class="call info"><span class="lbl">Sin ficha</span>
        Todavía no has creado un entrenador.
        <button class="btn sm" style="margin-left:8px" data-go="crear">Empezar ahora</button></div>`;
      el.querySelector('[data-go]').addEventListener('click', () => UI.show('crear'));
      return;
    }

    const f = t.stats;
    const ev = s => Math.min(6, Math.floor(s / 5));
    const rankName = { 1:'Patético', 2:'Sin entrenar', 3:'Novato', 4:'Adepto', 5:'Experto', 6:'Maestro' };
    const skills = Wizard.SKILLS.map(s => {
      const r = this.rankOf(s);
      const cls = r === 1 ? 'r' : r >= 4 ? 'g' : '';
      return `<div class="skill-roll">
        <div class="skname">${esc(s)} <span class="tag ${cls}">${rankName[r]}</span></div>
        <div class="skdice">${r}d6</div>
        <button class="btn ghost xs" data-roll="${esc(s)}">Tirar</button>
      </div>`;
    }).join('');

    // Mochila visual
    const itemInfo = {
      ball: { name: 'Poké Ball', icon: '⚪', desc: 'Se usa desde el combate para capturar.' },
      pot:  { name: 'Poción', icon: '🧪', desc: 'Recupera 20 PG a un Pokémon.' },
      rev:  { name: 'Revivir', icon: '💛', desc: 'Revive a un Pokémon debilitado.' },
      ant:  { name: 'Antídoto', icon: '💚', desc: 'Cura el estado Envenenado.' }
    };
    const bagItems = Object.entries(State.items)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => {
        const info = itemInfo[k];
        if (!info) return '';
        return `<div class="bag-item" data-item="${esc(k)}">
          <span class="bag-item-icon">${info.icon}</span>
          <div class="bag-item-body">
            <b>${esc(info.name)} <span class="bag-count">×${esc(v)}</span></b>
            <small>${esc(info.desc)}</small>
          </div>
          <button class="btn ghost xs" data-use="${esc(k)}">Usar</button>
        </div>`;
      })
      .filter(Boolean)
      .join('') || '<p style="color:var(--dim);font-size:13px">Sin objetos. Compra desde el asistente o gestiona el inventario abajo.</p>';

    // Pokémon activo
    const pkAct = activePokemon();
    let pkBlock = '';
    if (pkAct) {
      const base = Data.pokemon(pkAct.species);
      const stats = Pokemon._stats(pkAct);
      const pgMax = pkAct.level + stats.hp * 3 + 10;
      const pgNow = pkAct.hpCurrent === null ? pgMax : pkAct.hpCurrent;
      const movsList = (pkAct.moves || '').split('\n').filter(Boolean);
      pkBlock = `
        <div class="tw" style="margin-top:8px"><table>
          <tr>
            <td><b>${esc(pkAct.nickname || base?.es || pkAct.species)}</b></td>
            <td>Nv.${esc(pkAct.level)}</td>
            <td>${base ? base.t.map(ty => `<span class="tag" data-type="${esc(ty)}">${esc(ty)}</span>`).join(' ') : '—'}</td>
            <td class="num">${esc(pgNow)}/${esc(pgMax)} PG</td>
          </tr>
          ${pkAct.ability ? `<tr><td colspan="4"><b>Habilidad:</b> ${esc(pkAct.ability)}</td></tr>` : ''}
          ${movsList.length ? `<tr><td colspan="4"><b>Movimientos:</b> ${movsList.map(esc).join(', ')}</td></tr>` : ''}
        </table></div>`;
    }

    el.innerHTML = `
      <div class="card">
        <h2 style="margin-top:0">${esc(t.name)} <span style="color:var(--dim);font-weight:400">· Nivel ${esc(t.level)}</span></h2>
        ${t.concept ? `<p style="color:var(--dim);margin-top:0">${esc(t.concept)}</p>` : ''}

        ${t.story ? `<h3>Historia</h3><p style="white-space:pre-wrap">${esc(t.story)}</p>` : ''}

        <h3>Estadísticas</h3>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${esc(f.hp)}</span></div>
          <div class="stat"><b>Ataque</b><span>${esc(f.atk)}</span></div>
          <div class="stat"><b>Defensa</b><span>${esc(f.def)}</span></div>
          <div class="stat"><b>At. Esp.</b><span>${esc(f.spa)}</span></div>
          <div class="stat"><b>Def. Esp.</b><span>${esc(f.spd)}</span></div>
          <div class="stat"><b>Velocidad</b><span>${esc(f.spe)}</span></div>
        </div>
        <div class="stats" style="margin-top:8px">
          <div class="stat"><b>PG</b><span>${esc(t.level * 2 + f.hp * 3 + 10)}</span></div>
          <div class="stat"><b>PA</b><span>${esc(5 + Math.floor(t.level / 5))}</span></div>
          <div class="stat"><b>Ev. Fís.</b><span>${esc(ev(f.def))}</span></div>
          <div class="stat"><b>Ev. Esp.</b><span>${esc(ev(f.spd))}</span></div>
          <div class="stat"><b>Ev. Vel.</b><span>${esc(ev(f.spe))}</span></div>
        </div>

        <h3>Destrezas</h3>
        <div class="tw" style="padding:4px 0">${skills}</div>

        <h3>Ventajas y clase</h3>
        <p><b>Ventajas:</b> ${t.edges.length ? t.edges.map(e => `<span class="tag g">${esc(e)}</span>`).join(' ') : '<span style="color:var(--dim)">—</span>'}</p>
        <p><b>Clase:</b> ${t.clase ? esc(t.clase) : '<span style="color:var(--dim)">sin definir</span>'}</p>
        <p><b>Entrenamiento:</b> ${t.training ? esc(t.training) : '<span style="color:var(--dim)">—</span>'}</p>

        <h3>Mochila</h3>
        <div class="bag-list">${bagItems}</div>

        <h3>Pokémon activo</h3>
        ${pkBlock || '<p style="color:var(--dim)">Sin Pokémon asignado</p>'}

        <h3>Notas del entrenador</h3>
        <div class="field">
          <textarea id="tr-notes" rows="5" placeholder="Diario de campaña, objetivos, PNJ importantes, pistas…">${esc(t.notes || '')}</textarea>
          <small style="color:var(--dim);font-size:12px">Se guarda automáticamente.</small>
        </div>

        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap" class="no-print">
          <button class="btn ghost sm" data-go="crear">Editar en asistente</button>
          <button class="btn ghost sm" data-go="clases">Ver clases</button>
          <button class="btn ghost sm" onclick="window.print()">🖨 Imprimir</button>
        </div>
      </div>`;

    el.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => UI.show(b.dataset.go)));
    el.querySelectorAll('[data-roll]').forEach(b =>
      b.addEventListener('click', () => Tools.rollSkill(b.dataset.roll, b)));

    // Notas del entrenador
    el.querySelector('#tr-notes')?.addEventListener('input', e => {
      State.trainer.notes = e.target.value;
      persist();
    });

    // Usar objetos
    el.querySelectorAll('[data-use]').forEach(btn => {
      btn.addEventListener('click', () => this._useItem(btn.dataset.use));
    });
  },

  /** Usa un objeto del inventario sobre el Pokémon activo. */
  _useItem(key) {
    const pk = activePokemon();
    if (!pk) { alert('No tienes un Pokémon activo.'); return; }
    const base = Data.pokemon(pk.species);
    const stats = Pokemon._stats(pk);
    const pgMax = pk.level + stats.hp * 3 + 10;
    const pgNow = pk.hpCurrent === null ? pgMax : pk.hpCurrent;

    if (key === 'pot') {
      if (State.items.pot <= 0) { alert('No tienes Pociones.'); return; }
      if (pgNow >= pgMax) { alert('El Pokémon ya tiene los PG al máximo.'); return; }
      const healing = Math.min(20, pgMax - pgNow);
      const newHP = pgNow + healing;
      pk.hpCurrent = newHP === pgMax ? null : newHP;
      State.items.pot--;
      persist();
      UI.updateChip();
      this.render();
      alert(`Poción usada. ${pk.nickname || base.es} recupera ${healing} PG.`);
    } else if (key === 'rev') {
      if (State.items.rev <= 0) { alert('No tienes Revivir.'); return; }
      if (pgNow > 0) { alert('El Pokémon no está debilitado.'); return; }
      pk.hpCurrent = Math.max(1, Math.floor(pgMax / 2));
      State.items.rev--;
      persist();
      UI.updateChip();
      this.render();
      alert(`Revivir usado. ${pk.nickname || base.es} vuelve con ${pk.hpCurrent} PG.`);
    } else if (key === 'ant') {
      if (State.items.ant <= 0) { alert('No tienes Antídotos.'); return; }
      alert('Antídoto usado. En mesa, aplica la cura del estado Envenenado.');
      State.items.ant--;
      persist();
      this.render();
    } else if (key === 'ball') {
      alert('Las Poké Balls se usan desde la hoja de captura o el combate. Aquí solo se cuentan.');
    }
  },

  rankOf(skill) {
    const t = State.trainer;
    if (skill === t.adept) return 4;
    if (skill === t.novice) return 3;
    if (t.weak.includes(skill)) return 1;
    if (t.edges.includes(skill)) return 3;
    return 2;
  },

  renderClasses() {
    const wrap = document.getElementById('classCatalog');
    if (!wrap) return;
    const esc = Utils.escapeHtml;
    const filter = document.getElementById('cc-filter');
    const search = document.getElementById('cc-search').value.trim();
    const onlyOk = document.getElementById('cc-onlyok').checked;
    const hasTrainer = State.trainer.name && State.trainer.name.length > 0;

    if (!filter.dataset.bound) {
      filter.dataset.bound = '1';
      filter.innerHTML = '';
      filter.appendChild(new Option('Todas', ''));
      Object.entries(Data.classes.categories || {}).forEach(([k, v]) =>
        filter.appendChild(new Option(v, k)));
      filter.addEventListener('input', () => this.renderClasses());
      document.getElementById('cc-search').addEventListener('input', () => this.renderClasses());
      document.getElementById('cc-onlyok').addEventListener('input', () => this.renderClasses());
    }

    const cat = filter.value;
    let html = '';
    const classes = Data.classes.classes || {};
    const cats = cat ? { [cat]: Data.classes.categories[cat] } : (Data.classes.categories || {});
    const q = Utils.norm(search);

    let total = 0;

    Object.entries(cats).forEach(([cKey, cName]) => {
      const inCat = Object.entries(classes).filter(([, c]) => c.cat === cKey);
      const filtered = inCat.filter(([name, cl]) => {
        if (q && !Utils.norm(name).includes(q) && !Utils.norm(cl.desc || '').includes(q)) return false;
        if (onlyOk && hasTrainer && !this.meets(cl).ok) return false;
        return true;
      });
      if (!filtered.length) return;

      total += filtered.length;
      html += `<h3>${esc(cName)} <span style="color:var(--dim);font-weight:400;font-size:13px">(${filtered.length})</span></h3>`;
      html += `<div class="class-grid">`;
      filtered.forEach(([name, cl]) => {
        const meets = hasTrainer ? this.meets(cl) : { ok: false };
        const reqs = [];
        if (cl.req?.level && cl.req.level > 1) {
          const has = hasTrainer && State.trainer.level >= cl.req.level;
          reqs.push(`<span class="req-item ${has ? 'ok' : 'no'}">Nivel ${esc(cl.req.level)}</span>`);
        }
        Object.entries(cl.req?.skills || {}).forEach(([sk, need]) => {
          const has = hasTrainer && this.rankOf(sk) >= need;
          reqs.push(`<span class="req-item ${has ? 'ok' : 'no'}">${esc(sk)} ${esc(need)}d6</span>`);
        });
        const badge = hasTrainer
          ? `<span class="class-badge ${meets.ok ? 'ok' : 'no'}">${meets.ok ? '✓ lista' : '✗ faltan'}</span>`
          : '';
        html += `<div class="class-card ${meets.ok ? 'ok' : ''}">
          ${badge}
          <h5>${esc(name)}</h5>
          <p class="desc">${esc(cl.desc)}</p>
          <div class="req">${reqs.join(' ') || 'Sin requisitos'}</div>
          ${cl.feature_base ? `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:12px">
            <b style="color:var(--g)">${esc(cl.feature_base.name)}</b><br>
            <span style="color:var(--dim)">${esc(cl.feature_base.effect)}</span>
          </div>` : ''}
        </div>`;
      });
      html += `</div>`;
    });

    if (!total) {
      wrap.innerHTML = '<div class="call info">Ninguna clase coincide con el filtro.</div>';
      return;
    }

    wrap.innerHTML = `<p style="color:var(--dim);font-size:13px;margin:0 0 10px">${total} clases encontradas</p>${html}`;
  },

  meets(cl) {
    const issues = [];
    const t = State.trainer;
    if ((cl.req?.level || 1) > t.level) issues.push('nivel');
    Object.entries(cl.req?.skills || {}).forEach(([sk, need]) => {
      if (this.rankOf(sk) < need) issues.push(sk);
    });
    return { ok: issues.length === 0, issues };
  }
};
