/* ============================================================
   reference.js · Tipos, estados, glosario + Pokédex, Movimientos, Habilidades
   ============================================================ */
'use strict';

const Reference = {
  TYPES: {
    'Normal':   { se: [], res: ['Roca','Acero'], imm: ['Fantasma'] },
    'Fuego':    { se: ['Planta','Hielo','Bicho','Acero'], res: ['Fuego','Agua','Roca','Dragón'], imm: [] },
    'Agua':     { se: ['Fuego','Tierra','Roca'], res: ['Agua','Planta','Dragón'], imm: [] },
    'Eléctrico':{ se: ['Agua','Volador'], res: ['Eléctrico','Planta','Dragón'], imm: ['Tierra'] },
    'Planta':   { se: ['Agua','Tierra','Roca'], res: ['Fuego','Planta','Veneno','Volador','Bicho','Dragón','Acero'], imm: [] },
    'Hielo':    { se: ['Planta','Tierra','Volador','Dragón'], res: ['Fuego','Agua','Hielo','Acero'], imm: [] },
    'Lucha':    { se: ['Normal','Hielo','Roca','Siniestro','Acero'], res: ['Veneno','Volador','Psíquico','Bicho','Hada'], imm: ['Fantasma'] },
    'Veneno':   { se: ['Planta','Hada'], res: ['Veneno','Tierra','Roca','Fantasma'], imm: ['Acero'] },
    'Tierra':   { se: ['Fuego','Eléctrico','Veneno','Roca','Acero'], res: ['Planta','Bicho'], imm: ['Volador'] },
    'Volador':  { se: ['Planta','Lucha','Bicho'], res: ['Eléctrico','Roca','Acero'], imm: [] },
    'Psíquico': { se: ['Lucha','Veneno'], res: ['Psíquico','Acero'], imm: ['Siniestro'] },
    'Bicho':    { se: ['Planta','Psíquico','Siniestro'], res: ['Fuego','Lucha','Veneno','Volador','Fantasma','Acero','Hada'], imm: [] },
    'Roca':     { se: ['Fuego','Hielo','Volador','Bicho'], res: ['Lucha','Tierra','Acero'], imm: [] },
    'Fantasma': { se: ['Psíquico','Fantasma'], res: ['Siniestro'], imm: ['Normal'] },
    'Dragón':   { se: ['Dragón'], res: ['Acero'], imm: ['Hada'] },
    'Siniestro':{ se: ['Psíquico','Fantasma'], res: ['Lucha','Siniestro','Hada'], imm: [] },
    'Acero':    { se: ['Hielo','Roca','Hada'], res: ['Fuego','Agua','Eléctrico','Acero'], imm: [] },
    'Hada':     { se: ['Lucha','Dragón','Siniestro'], res: ['Fuego','Veneno','Acero'], imm: [] }
  },

  EST_PERSIST: [
    ['Quemado',   '−2 CS Defensa; pierde 1 tick al final del turno si actúa. Los Pokémon de Fuego son inmunes.'],
    ['Envenenado','−2 CS Defensa Especial; pierde 1 tick. Los de Veneno y Acero son inmunes.'],
    ['Grave',     'Como envenenado, pero pierde 5, 10, 20, 40… PG por ronda.'],
    ['Paralizado','−4 CS Velocidad; necesita 5+ en 1d20 para actuar. Eléctrico inmune.'],
    ['Congelado', 'No puede actuar; necesita 16+ para curarse (11+ si es de Fuego).']
  ],

  EST_VOLAT: [
    ['Dormido',    'No puede actuar; necesita 16+ para despertar.'],
    ['Confuso',    '1-8 se golpea a sí mismo; 9-15 actúa; 16+ se cura.'],
    ['Retroceso',  'Pierde el siguiente turno.'],
    ['Enfurecido', 'Debe atacar; necesita 15+ para curarse.'],
    ['Enamorado',  '1-10 no ataca al causante; 19+ se cura.'],
    ['Anulado',    'No puede usar ese movimiento.'],
    ['Maldito',    'Pierde 2 ticks si usa una acción estándar.'],
    ['Suprimido',  'Sus frecuencias se empeoran temporalmente.']
  ],

  DESCANSO: [
    ['Reposo',              'Cada 30 min, recupera 1/16 de los PG máximos (primeras 8 h).'],
    ['Descanso prolongado', '4 h. Cura estados persistentes y recupera PA drenados.'],
    ['Centro Pokémon',      '1 h + 30 min por herida. Máx. 3 heridas al día.'],
    ['Tomar un respiro',    'Acción completa. Reinicia CS, quita PG temporales y volátiles.']
  ],

  /* ============================================================
     TIPOS
     ============================================================ */
  renderTypes() {
    const grid = document.getElementById('tgrid');
    const info = document.getElementById('tinfo');
    if (!grid || grid.children.length) return;
    Object.entries(this.TYPES).forEach(([t, c]) => {
      const b = document.createElement('button');
      b.className = 'tbtn';
      b.dataset.t = t;
      b.textContent = t;
      b.addEventListener('click', () => {
        grid.querySelectorAll('.tbtn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        info.innerHTML = `
          <h3 style="color:var(--g);margin-top:0">${t}</h3>
          <div class="grid c3">
            <div><h4 style="margin-top:0">Supereficaz contra</h4><p>${c.se.join(', ') || '—'}</p></div>
            <div><h4 style="margin-top:0">Resistido por</h4><p>${c.res.join(', ') || '—'}</p></div>
            <div><h4 style="margin-top:0">No afecta a</h4><p>${c.imm.join(', ') || '—'}</p></div>
          </div>`;
      });
      grid.appendChild(b);
    });
  },

  /* ============================================================
     ESTADOS
     ============================================================ */
  renderStates() {
    const rows = arr => arr.map(([n, d]) => `<tr><td><b>${n}</b></td><td>${d}</td></tr>`).join('');
    const p = document.getElementById('estPersist');
    const v = document.getElementById('estVolat');
    const d = document.getElementById('descansoTable');
    if (p) p.innerHTML = `<div class="tw"><table><tbody>${rows(this.EST_PERSIST)}</tbody></table></div>`;
    if (v) v.innerHTML = `<div class="tw"><table><tbody>${rows(this.EST_VOLAT)}</tbody></table></div>`;
    if (d) d.innerHTML = `<div class="tw"><table><tbody>${rows(this.DESCANSO)}</tbody></table></div>`;
  },

  /* ============================================================
     GLOSARIO
     ============================================================ */
  renderGlossary() {
    const body = document.getElementById('glosarioBody');
    if (!body) return;
    const search = (document.getElementById('glossSearch')?.value || '').toLowerCase();
    const entries = Object.entries(Data.glossary || {}).filter(([k, v]) => {
      if (k.startsWith('_')) return false;
      if (!search) return true;
      const desc = typeof v === 'string' ? v : (v.desc || '');
      return k.toLowerCase().includes(search) || desc.toLowerCase().includes(search);
    });
    body.innerHTML = entries.map(([k, v]) => {
      const desc = typeof v === 'string' ? v : (v.desc || '');
      return `<tr><td><b>${k}</b></td><td>${desc}</td></tr>`;
    }).join('') || '<tr><td colspan="2" style="color:var(--dim)">Sin resultados.</td></tr>';

    const inp = document.getElementById('glossSearch');
    if (inp && !inp.dataset.bound) {
      inp.addEventListener('input', () => this.renderGlossary());
      inp.dataset.bound = '1';
    }
  },

  /* ============================================================
     POKÉDEX (NUEVA)
     ============================================================ */
  renderPokedex() {
    const list = document.getElementById('dex-list');
    const detail = document.getElementById('dex-detail');
    if (!list) return;

    // Inicializar filtros una sola vez
    const searchInp = document.getElementById('dex-search');
    const typeSel = document.getElementById('dex-type');

    if (!searchInp.dataset.bound) {
      searchInp.dataset.bound = '1';
      // Llenar tipos
      Object.keys(this.TYPES).forEach(t => {
        typeSel.appendChild(new Option(t, t));
      });
      searchInp.addEventListener('input', () => this._renderDexList());
      typeSel.addEventListener('input', () => this._renderDexList());
    }

    this._renderDexList();
    detail.classList.add('hide');
    list.classList.remove('hide');
  },

  _renderDexList() {
    const list = document.getElementById('dex-list');
    const search = (document.getElementById('dex-search').value || '').toLowerCase();
    const tipo = document.getElementById('dex-type').value;

    const keys = Data.pokemonKeys().filter(k => {
      const p = Data.pokemon(k);
      if (!p || k.startsWith('_')) return false;
      if (search && !(p.es || k).toLowerCase().includes(search)) return false;
      if (tipo && !p.t.includes(tipo)) return false;
      return true;
    });

    if (!keys.length) {
      list.innerHTML = '<div class="call info">Ningún Pokémon coincide con los filtros.</div>';
      return;
    }

    list.innerHTML = `
      <p style="color:var(--dim);font-size:13px;margin:0 0 10px">${keys.length} Pokémon encontrados</p>
      <div class="grid c3">
        ${keys.map(k => {
          const p = Data.pokemon(k);
          return `<button class="action-card" data-pk-key="${k}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
              <b style="font-size:15px">${p.es || k}</b>
            </div>
            <div style="margin-bottom:8px">${p.t.map(t => `<span class="tag b">${t}</span>`).join('')}</div>
            <div class="stats" style="grid-template-columns:repeat(3,1fr);gap:4px">
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">HP</b><span style="font-size:14px">${p.hp}</span></div>
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">Atk</b><span style="font-size:14px">${p.atk}</span></div>
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">Def</b><span style="font-size:14px">${p.def}</span></div>
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">SpA</b><span style="font-size:14px">${p.spa}</span></div>
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">SpD</b><span style="font-size:14px">${p.spd}</span></div>
              <div class="stat" style="padding:4px 2px"><b style="font-size:9px">Spe</b><span style="font-size:14px">${p.spe}</span></div>
            </div>
          </button>`;
        }).join('')}
      </div>`;

    list.querySelectorAll('[data-pk-key]').forEach(card => {
      card.addEventListener('click', () => this._showDexDetail(card.dataset.pkKey));
    });
  },

  _showDexDetail(key) {
    const list = document.getElementById('dex-list');
    const detail = document.getElementById('dex-detail');
    const p = Data.pokemon(key);
    if (!p) return;

    list.classList.add('hide');
    detail.classList.remove('hide');

    const habilidades = [];
    if (p.abilities) {
      (p.abilities.basic || []).forEach(h => habilidades.push({ tipo: 'Básica', n: h }));
      (p.abilities.advanced || []).forEach(h => habilidades.push({ tipo: 'Avanzada', n: h }));
      if (p.abilities.high) habilidades.push({ tipo: 'Alta', n: p.abilities.high });
    }

    const abInfo = habilidades.map(h => {
      const info = Data.abilities[h.n];
      return `<tr>
        <td><span class="tag ${h.tipo === 'Básica' ? 'g' : h.tipo === 'Avanzada' ? 'b' : 'p'}">${h.tipo}</span></td>
        <td><b>${h.n}</b></td>
        <td>${info ? info.desc : '<span style="color:var(--dim)">—</span>'}</td>
      </tr>`;
    }).join('');

    const movs = (p.moves?.level || []).map(m => {
      const info = Data.move(m.name);
      return `<tr>
        <td class="num">${m.lvl}</td>
        <td><b>${m.name}</b></td>
        <td>${info ? `<span class="tag">${info.type}</span>` : '<span class="tag">' + (m.t || '—') + '</span>'}</td>
        <td class="num">${info ? info.db : '—'}</td>
        <td class="num">${info ? (info.ac ?? '—') : '—'}</td>
        <td>${info ? info.class : '—'}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" style="color:var(--dim)">Sin movimientos registrados.</td></tr>';

    detail.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <button class="btn ghost xs" id="dex-back">← Volver a la lista</button>
        </div>

        <h2 style="margin-top:0">${p.es || key}</h2>
        <div style="margin-bottom:12px">${p.t.map(t => `<span class="tag b" style="font-size:13px;padding:4px 10px">${t}</span>`).join(' ')}</div>

        ${p.size ? `<p style="font-size:13px;color:var(--dim)">
          <b>Tamaño:</b> ${p.size.cat} · <b>Altura:</b> ${p.size.h} m · <b>Peso:</b> ${p.size.w} kg · <b>Peso clase:</b> ${p.size.wc}
        </p>` : ''}
        ${p.diet ? `<p style="font-size:13px;color:var(--dim)"><b>Dieta:</b> ${p.diet}</p>` : ''}
        ${p.habitat ? `<p style="font-size:13px;color:var(--dim)"><b>Hábitat:</b> ${p.habitat.join(', ')}</p>` : ''}
        ${p.evo ? `<p style="font-size:13px;color:var(--dim)"><b>Evoluciona:</b> ${p.evo.next}${p.evo.at ? ' al nivel ' + p.evo.at : ''}${p.evo.final ? ' → ' + p.evo.final : ''}</p>` : ''}

        <h3>Estadísticas base</h3>
        <div class="stats">
          <div class="stat"><b>Salud</b><span>${p.hp}</span></div>
          <div class="stat"><b>Ataque</b><span>${p.atk}</span></div>
          <div class="stat"><b>Defensa</b><span>${p.def}</span></div>
          <div class="stat"><b>At. Esp.</b><span>${p.spa}</span></div>
          <div class="stat"><b>Def. Esp.</b><span>${p.spd}</span></div>
          <div class="stat"><b>Velocidad</b><span>${p.spe}</span></div>
        </div>

        ${abInfo ? `<h3>Habilidades</h3>
        <div class="tw"><table>
          <thead><tr><th>Tipo</th><th>Nombre</th><th>Descripción</th></tr></thead>
          <tbody>${abInfo}</tbody>
        </table></div>` : ''}

        <h3>Movimientos por nivel</h3>
        <div class="tw"><table>
          <thead><tr><th class="num">Niv.</th><th>Movimiento</th><th>Tipo</th><th class="num">DB</th><th class="num">AC</th><th>Clase</th></tr></thead>
          <tbody>${movs}</tbody>
        </table></div>
      </div>`;

    detail.querySelector('#dex-back').addEventListener('click', () => {
      detail.classList.add('hide');
      list.classList.remove('hide');
    });
  },

  /* ============================================================
     MOVIMIENTOS (NUEVA)
     ============================================================ */
  renderMoves() {
    const tbody = document.getElementById('mov-tbody');
    const counter = document.getElementById('mov-count');
    if (!tbody) return;

    const searchInp = document.getElementById('mov-search');
    const typeSel = document.getElementById('mov-type');
    const classSel = document.getElementById('mov-class');

    if (!searchInp.dataset.bound) {
      searchInp.dataset.bound = '1';
      Object.keys(this.TYPES).forEach(t => typeSel.appendChild(new Option(t, t)));
      searchInp.addEventListener('input', () => this._renderMovesList());
      typeSel.addEventListener('input', () => this._renderMovesList());
      classSel.addEventListener('input', () => this._renderMovesList());
    }

    this._renderMovesList();
  },

  _renderMovesList() {
    const tbody = document.getElementById('mov-tbody');
    const counter = document.getElementById('mov-count');
    const search = (document.getElementById('mov-search').value || '').toLowerCase();
    const tipo = document.getElementById('mov-type').value;
    const cls = document.getElementById('mov-class').value;

    const movs = Object.entries(Data.moves || {})
      .filter(([k, m]) => {
        if (k.startsWith('_') || !m || !m.type) return false;
        if (search && !k.toLowerCase().includes(search) && !(m.en || '').toLowerCase().includes(search)) return false;
        if (tipo && m.type !== tipo) return false;
        if (cls && m.class !== cls) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    counter.textContent = `${movs.length} movimientos encontrados`;

    if (!movs.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:var(--dim);text-align:center;padding:20px">Sin resultados.</td></tr>';
      return;
    }

    const claseName = { Physical: 'Físico', Special: 'Especial', Status: 'Estado' };

    tbody.innerHTML = movs.map(([name, m]) => `
      <tr>
        <td><b>${name}</b>${m.en ? `<br><span style="color:var(--dim);font-size:11px">${m.en}</span>` : ''}</td>
        <td><span class="tag b">${m.type}</span></td>
        <td>${claseName[m.class] || m.class}</td>
        <td class="num">${m.db || '—'}</td>
        <td class="num">${m.ac ?? '—'}</td>
        <td style="font-size:12px">${m.range || '—'}</td>
        <td style="font-size:12px;max-width:280px">${m.effect || '—'}</td>
      </tr>`).join('');
  },

  /* ============================================================
     HABILIDADES (NUEVA)
     ============================================================ */
  renderAbilities() {
    const list = document.getElementById('ab-list');
    if (!list) return;

    const searchInp = document.getElementById('ab-search');
    const tipoSel = document.getElementById('ab-tipo');

    if (!searchInp.dataset.bound) {
      searchInp.dataset.bound = '1';
      // Llenar tipos únicos
      const tipos = new Set();
      Object.values(Data.abilities || {}).forEach(a => {
        if (a && a.tipo && !a.tipo.startsWith('_')) tipos.add(a.tipo);
      });
      [...tipos].sort().forEach(t => tipoSel.appendChild(new Option(t, t)));
      searchInp.addEventListener('input', () => this._renderAbilitiesList());
      tipoSel.addEventListener('input', () => this._renderAbilitiesList());
    }

    this._renderAbilitiesList();
  },

  _renderAbilitiesList() {
    const list = document.getElementById('ab-list');
    const search = (document.getElementById('ab-search').value || '').toLowerCase();
    const tipo = document.getElementById('ab-tipo').value;

    const abilities = Object.entries(Data.abilities || {})
      .filter(([k, a]) => {
        if (k.startsWith('_') || !a) return false;
        if (search && !k.toLowerCase().includes(search) && !(a.desc || '').toLowerCase().includes(search)) return false;
        if (tipo && a.tipo !== tipo) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    if (!abilities.length) {
      list.innerHTML = '<div class="call info">Sin resultados.</div>';
      return;
    }

    list.innerHTML = `
      <p style="color:var(--dim);font-size:13px;margin:0 0 10px">${abilities.length} habilidades encontradas</p>
      <div class="grid c2">
        ${abilities.map(([name, a]) => `
          <div class="card t" style="margin:0">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:8px">
              <b style="font-size:15px">${name}</b>
              <span class="tag p">${a.tipo || '—'}</span>
            </div>
            <p style="font-size:13px;margin:0 0 8px;color:var(--g)">${a.desc || '—'}</p>
            <p style="font-size:12.5px;margin:0;color:var(--dim);line-height:1.5">${a.full || ''}</p>
          </div>`).join('')}
      </div>`;
  }
};
