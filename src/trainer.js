
/* ============================================================
   trainer.js · Vista del entrenador + catálogo de clases
   ============================================================ */
'use strict';

const Trainer = {
  render() {
    const t = State.trainer;
    const el = document.getElementById('entrenadorView');
    if (!el) return;
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
        <div class="skname">${s} <span class="tag ${cls}">${rankName[r]}</span></div>
        <div class="skdice">${r}d6</div>
        <button class="btn ghost xs" data-roll="${s}">Tirar</button>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="card">
        <h2 style="margin-top:0">${t.name} <span style="color:var(--dim);font-weight:400">· Nivel ${t.level}</span></h2>
        ${t.concept ? `<p style="color:var(--dim);margin-top:0">${t.concept}</p>` : ''}

        <h3>Estadísticas</h3>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${f.hp}</span></div>
          <div class="stat"><b>Ataque</b><span>${f.atk}</span></div>
          <div class="stat"><b>Defensa</b><span>${f.def}</span></div>
          <div class="stat"><b>At. Esp.</b><span>${f.spa}</span></div>
          <div class="stat"><b>Def. Esp.</b><span>${f.spd}</span></div>
          <div class="stat"><b>Velocidad</b><span>${f.spe}</span></div>
        </div>
        <div class="stats" style="margin-top:8px">
          <div class="stat"><b>PG</b><span>${t.level * 2 + f.hp * 3 + 10}</span></div>
          <div class="stat"><b>PA</b><span>${5 + Math.floor(t.level / 5)}</span></div>
          <div class="stat"><b>Ev. Fís.</b><span>${ev(f.def)}</span></div>
          <div class="stat"><b>Ev. Esp.</b><span>${ev(f.spd)}</span></div>
          <div class="stat"><b>Ev. Vel.</b><span>${ev(f.spe)}</span></div>
        </div>

        <h3>Destrezas</h3>
        <p style="font-size:12.5px;color:var(--dim);margin:0">Haz clic en <b>Tirar</b> para usar los dados actuales.</p>
        <div class="tw" style="padding:4px 0">${skills}</div>

        <h3>Edges y clase</h3>
        <p><b>Edges:</b> ${t.edges.length ? t.edges.map(e => `<span class="tag g">${e}</span>`).join(' ') : '<span style="color:var(--dim)">—</span>'}</p>
        <p><b>Clase:</b> ${t.clase || '<span style="color:var(--dim)">sin definir</span>'}</p>

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
  },

  /** Rango (1-6) de una destreza. */
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
    const filter = document.getElementById('cc-filter');
    const search = document.getElementById('cc-search').value.trim().toLowerCase();
    const onlyOk = document.getElementById('cc-onlyok').checked;

    // Llenar filtro de categorías la primera vez
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

    Object.entries(cats).forEach(([cKey, cName]) => {
      const inCat = Object.entries(classes).filter(([, c]) => c.cat === cKey);
      const filtered = inCat.filter(([name, cl]) => {
        if (search && !name.toLowerCase().includes(search)) return false;
        if (onlyOk && !this.meets(cl).ok) return false;
        return true;
      });
      if (!filtered.length) return;

      html += `<h3>${cName} <span style="color:var(--dim);font-weight:400;font-size:13px">(${filtered.length})</span></h3>`;
      html += `<div class="class-grid">`;
      filtered.forEach(([name, cl]) => {
        const { ok } = this.meets(cl);
        const reqs = [];
        if (cl.req?.level && cl.req.level > 1) {
          const has = State.trainer.level >= cl.req.level;
          reqs.push(`<span class="req-item ${has ? 'ok' : 'no'}">Nivel ${cl.req.level}</span>`);
        }
        Object.entries(cl.req?.skills || {}).forEach(([sk, need]) => {
          const has = this.rankOf(sk) >= need;
          reqs.push(`<span class="req-item ${has ? 'ok' : 'no'}">${sk} ${need}d6</span>`);
        });
        html += `<div class="class-card ${ok ? 'ok' : ''}">
          <span class="class-badge ${ok ? 'ok' : 'no'}">${ok ? '✓ lista' : '✗ faltan'}</span>
          <h5>${name}</h5>
          <p class="desc">${cl.desc}</p>
          <div class="req">${reqs.join(' ') || 'Sin requisitos'}</div>
        </div>`;
      });
      html += `</div>`;
    });

    wrap.innerHTML = html || '<div class="call info">Ninguna clase coincide con el filtro.</div>';
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
