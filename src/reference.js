/* ============================================================
   reference.js · Tipos, estados, glosario
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
    ['Reposo',                'Cada 30 min, recupera 1/16 de los PG máximos (primeras 8 h).'],
    ['Descanso prolongado',   '4 h. Cura estados persistentes y recupera PA drenados.'],
    ['Centro Pokémon',        '1 h + 30 min por herida. Máx. 3 heridas al día.'],
    ['Tomar un respiro',      'Acción completa. Reinicia CS, quita PG temporales y volátiles.']
  ],

  renderTypes() {
    const grid = document.getElementById('tgrid');
    const info = document.getElementById('tinfo');
    if (!grid) return;
    if (grid.children.length) return; // ya inicializado

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

  renderStates() {
    const rows = arr => arr.map(([n, d]) => `<tr><td><b>${n}</b></td><td>${d}</td></tr>`).join('');
    const p = document.getElementById('estPersist');
    const v = document.getElementById('estVolat');
    const d = document.getElementById('descansoTable');
    if (p) p.innerHTML = `<div class="tw"><table><tbody>${rows(this.EST_PERSIST)}</tbody></table></div>`;
    if (v) v.innerHTML = `<div class="tw"><table><tbody>${rows(this.EST_VOLAT)}</tbody></table></div>`;
    if (d) d.innerHTML = `<div class="tw"><table><tbody>${rows(this.DESCANSO)}</tbody></table></div>`;
  },

  renderGlossary() {
    const body = document.getElementById('glosarioBody');
    if (!body) return;
    const search = (document.getElementById('glossSearch')?.value || '').toLowerCase();
    const entries = Object.entries(Data.glossary || {}).filter(([k, v]) =>
      !search || k.toLowerCase().includes(search) || (v?.desc || '').toLowerCase().includes(search)
    );
    body.innerHTML = entries.map(([k, v]) => {
      const desc = typeof v === 'string' ? v : (v.desc || '');
      return `<tr><td><b>${k}</b></td><td>${desc}</td></tr>`;
    }).join('') || '<tr><td colspan="2" style="color:var(--dim)">Sin resultados.</td></tr>';

    const inp = document.getElementById('glossSearch');
    if (inp && !inp.dataset.bound) {
      inp.addEventListener('input', () => this.renderGlossary());
      inp.dataset.bound = '1';
    }
  }
};