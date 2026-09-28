/* ============================================================
   reference.js · Tipos, estados, glosario + Pokédex, Movimientos,
   Habilidades + sección Aprende a jugar
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
    ['Quemado',   '−2 Defensa. Pierde 1/10 de PG al final del turno si actúa. Los Pokémon de Fuego son inmunes.'],
    ['Envenenado','−2 Defensa Especial. Pierde 1/10 de PG. Los de Veneno y Acero son inmunes.'],
    ['Grave',     'Como envenenado, pero pierde 5, 10, 20, 40… PG por ronda.'],
    ['Paralizado','−4 Velocidad. Necesita 5+ en 1d20 para actuar. Eléctrico inmune.'],
    ['Congelado', 'No puede actuar. Necesita 16+ para curarse (11+ si es de Fuego).']
  ],

  EST_VOLAT: [
    ['Dormido',    'No puede actuar. Necesita 16+ para despertar.'],
    ['Confuso',    '1-8 se golpea a sí mismo; 9-15 actúa; 16+ se cura.'],
    ['Retroceso',  'Pierde el siguiente turno.'],
    ['Enfurecido', 'Debe atacar. Necesita 15+ para curarse.'],
    ['Enamorado',  '1-10 no ataca al causante; 19+ se cura.'],
    ['Anulado',    'No puede usar ese movimiento.'],
    ['Maldito',    'Pierde 2 décimas de PG si usa una acción estándar.'],
    ['Suprimido',  'Sus frecuencias se empeoran temporalmente.']
  ],

  DESCANSO: [
    ['Reposo',              'Cada 30 min, recupera 1/16 de los PG máximos (primeras 8 h).'],
    ['Descanso prolongado', '4 h. Cura estados persistentes y recupera PA drenados.'],
    ['Centro Pokémon',      '1 h + 30 min por herida. Máx. 3 heridas al día.'],
    ['Tomar un respiro',    'Acción completa. Reinicia CS, quita PG temporales y volátiles.']
  ],

  LEARN_SECTIONS: [
    {
      id: 'que-es',
      title: '1. ¿Qué es esto?',
      summary: 'Un juego donde tú y tus amigos cuentan una historia juntos.',
      body: `
        <p>Imagina que tú y tres amigos están sentados en una mesa. Uno de ustedes (el <b>Narrador</b>) describe
        una escena: "Están en un bosque al atardecer. Escuchan un ruido entre los árboles".</p>
        <p>Los demás (<b>jugadores</b>) deciden qué hacen sus personajes. Ustedes son <b>entrenadores Pokémon</b>:
        personas que capturan, entrenan y pelean junto a criaturas llamadas Pokémon.</p>
        <p>Cuando algo es incierto — por ejemplo, "¿logro escalar el árbol antes de que llegue el Pokémon?" — se
        <b>tiran dados</b> para decidir. El azar mete emoción y la historia avanza.</p>
        <div class="call info">
          <span class="lbl">En una frase</span>
          Es un juego de contar historias con dados. Tú y tus amigos son los protagonistas.
        </div>`
    },
    {
      id: 'narrador',
      title: '2. ¿Qué es el Narrador?',
      summary: 'El amigo que describe el mundo y controla a los enemigos.',
      body: `
        <p>El <b>Narrador</b> (también llamado <b>DJ</b> o <b>Game Master</b>) es un jugador más, pero con otro rol:</p>
        <ul style="padding-left:20px">
          <li>Describe el mundo, los lugares y los personajes secundarios.</li>
          <li>Controla a los Pokémon salvajes y a los enemigos.</li>
          <li>Decide si tu acción tiene éxito o necesita una tirada.</li>
          <li>Improvisa la historia según lo que eligen los jugadores.</li>
        </ul>
        <p>No es un enemigo: está de tu lado. Su trabajo es que la historia sea divertida.</p>
        <div class="call info">
          <span class="lbl">Truco</span>
          Si tienes dudas, pregúntale al Narrador. Para eso está.
        </div>`
    },
    {
      id: 'dos-personajes',
      title: '3. Tú y tu Pokémon son dos',
      summary: 'Cada uno tiene su propia ficha y su turno.',
      body: `
        <p>En PTU, cada jugador controla <b>dos personajes</b>:</p>
        <ul style="padding-left:20px">
          <li><b>Tu entrenador</b> — tú. Puede atacar, usar objetos, dar órdenes y activar habilidades.</li>
          <li><b>Tu Pokémon</b> — tu compañero. Tiene sus propios movimientos y estadísticas.</li>
        </ul>
        <p>En un combate, cada uno tiene su turno. Es como si jugaras dos turnos distintos, coordinados entre sí.</p>
        <div class="call">
          <span class="lbl">Ejemplo</span>
          En tu turno de entrenador puedes lanzar una Poké Ball, usar una Poción o atacar con tu arma.
          En tu turno de Pokémon puedes moverte y usar un movimiento como Lanzallamas o Placaje.
        </div>`
    },
    {
      id: 'dados',
      title: '4. Las tiradas de dados',
      summary: 'Hay tres tiradas clave que usarás todo el tiempo.',
      body: `
        <p>La app tira los dados por ti. Solo necesitas entender cuándo se tira cada cosa:</p>

        <h4>a) Destreza</h4>
        <p>Cuando intentas algo difícil (trepar, engañar, recordar algo…). Tiras tantos <code>d6</code>
        como tu rango. Si tienes 4 dados, tiras 4d6 y sumas los resultados.</p>

        <h4>b) Ataque</h4>
        <p>Cuando intentas golpear a alguien. Tiras <code>1d20 + precisión</code> y buscas superar la defensa del enemigo.</p>

        <h4>c) Captura</h4>
        <p>Cuando lanzas una Poké Ball. Tiras <code>1d100</code> menos el nivel del Pokémon. Si sale menos que la tasa, capturas.</p>

        <div class="call warn">
          <span class="lbl">Error común</span>
          El valor de tu estadística <b>Ataque no se suma a la tirada para acertar</b>.
          Solo se suma al daño, después de acertar.
        </div>`
    },
    {
      id: 'combate',
      title: '5. Un combate, paso a paso',
      summary: 'Quién va primero, qué puedes hacer, cómo se hace daño.',
      body: `
        <p>Cuando empieza un combate, se calculan las <b>iniciativas</b>: la Velocidad de cada participante.
        Actúan de mayor a menor.</p>

        <h4>En tu turno puedes hacer tres cosas</h4>
        <ul style="padding-left:20px">
          <li><b>Acción estándar</b> — Atacar, usar un objeto, lanzar una Poké Ball.</li>
          <li><b>Acción de movimiento</b> — Desplazarte por el escenario.</li>
          <li><b>Acción rápida</b> — Algo ligero, como una orden o un gesto.</li>
        </ul>

        <h4>Cómo se calcula el daño</h4>
        <ol style="padding-left:20px">
          <li>Buscas la <b>DB</b> (Base de Daño) del movimiento.</li>
          <li>Miras la tabla de daño: te dice cuántos dados tirar y cuánto daño fijo añadir.</li>
          <li>Sumas tu estadística de Ataque (o At. Esp.).</li>
          <li>Restas la Defensa (o Def. Esp.) del enemigo.</li>
          <li>Multiplicas según el tipo (si es muy eficaz o poco eficaz).</li>
          <li>Restas el daño de los PG (Puntos de Golpe) del enemigo.</li>
        </ol>

        <p>No necesitas memorizarlo: la app tiene una <b>calculadora</b> que hace las cuentas por ti.</p>`
    },
    {
      id: 'mi-ficha',
      title: '6. ¿Qué es una ficha?',
      summary: 'Un documento con todo lo importante de tu personaje.',
      body: `
        <p>Una <b>ficha</b> es donde vive tu personaje. Ahí apuntas:</p>
        <ul style="padding-left:20px">
          <li>Su nombre y su historia.</li>
          <li>Sus 6 estadísticas (Salud, Ataque, Defensa, At. Esp., Def. Esp., Velocidad).</li>
          <li>Sus destrezas (17 en total, de Patético a Maestro).</li>
          <li>Su Pokémon y qué puede hacer.</li>
          <li>Su equipo (Poké Balls, Pociones, dinero…).</li>
        </ul>
        <p>Esta app genera la ficha por ti con un asistente. Solo eliges opciones.</p>
        <div class="call">
          <span class="lbl">Consejo</span>
          Antes de crear la tuya, mira los <b>ejemplos</b> desde el Inicio. Así ves cómo se ve una ficha completa.
        </div>`
    },
    {
      id: 'app',
      title: '7. Cómo usar esta app',
      summary: 'Las secciones que vas a usar más.',
      body: `
        <p>La app tiene tres usos:</p>

        <h4>Consultar</h4>
        <ul style="padding-left:20px">
          <li><b>Pokédex</b> — Busca cualquier Pokémon y mira sus stats, tipos, habilidades y movimientos.</li>
          <li><b>Movimientos</b> — Todo lo que puede hacer cada ataque.</li>
          <li><b>Habilidades</b> — Qué hace cada habilidad especial.</li>
          <li><b>Clases</b> — Caminos de especialización.</li>
        </ul>

        <h4>Jugar</h4>
        <ul style="padding-left:20px">
          <li><b>Crear entrenador</b> — El asistente te hace tu ficha paso a paso.</li>
          <li><b>Combate</b> — Lleva el orden de los turnos, PG y estados.</li>
          <li><b>Calculadoras</b> — Daño, captura, tabla de referencia.</li>
          <li><b>Dados</b> — Tira cualquier dado cuando lo necesites.</li>
        </ul>

        <h4>Compartir con tu grupo</h4>
        <ul style="padding-left:20px">
          <li><b>Compartir ficha</b> — Genera un código que pegas en el chat.</li>
          <li><b>Vista del Narrador</b> — Para el Narrador: guarda las fichas de todos.</li>
        </ul>

        <p>Todo funciona sin internet. Todo se guarda en tu navegador. No hay cuentas ni servidores.</p>`
    }
  ],

  renderLearn() {
    const cont = document.getElementById('aprenderContent');
    if (!cont) return;
    cont.innerHTML = this.LEARN_SECTIONS.map(sec => `
      <details class="learn-section">
        <summary>
          <div>
            <b>${sec.title}</b>
            <div style="font-size:12.5px;color:var(--dim);font-weight:400;margin-top:2px">${sec.summary}</div>
          </div>
        </summary>
        <div class="bd" style="line-height:1.7">${sec.body}</div>
      </details>
    `).join('');
  },

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

  renderPokedex() {
    const list = document.getElementById('dex-list');
    const detail = document.getElementById('dex-detail');
    if (!list) return;
    const searchInp = document.getElementById('dex-search');
    const typeSel = document.getElementById('dex-type');
    if (!searchInp.dataset.bound) {
      searchInp.dataset.bound = '1';
      Object.keys(this.TYPES).forEach(t => typeSel.appendChild(new Option(t, t)));
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
            <div style="margin-bottom:8px"><b style="font-size:15px">${p.es || k}</b></div>
            <div style="margin-bottom:8px">${p.t.map(t => `<span class="tag" data-type="${t}">${t}</span>`).join('')}</div>
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
        <td>${info ? `<span class="tag" data-type="${info.type}">${info.type}</span>` : `<span class="tag"${m.t ? ` data-type="${m.t}"` : ''}>${m.t || '—'}</span>`}</td>
        <td class="num">${info ? info.db : '—'}</td>
        <td class="num">${info ? (info.ac ?? '—') : '—'}</td>
        <td>${info ? info.class : '—'}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" style="color:var(--dim)">Sin movimientos registrados.</td></tr>';

    detail.innerHTML = `
      <div class="card">
        <div style="margin-bottom:12px"><button class="btn ghost xs" id="dex-back">← Volver a la lista</button></div>
        <h2 style="margin-top:0">${p.es || key}</h2>
        <div style="margin-bottom:12px">${p.t.map(t => `<span class="tag" data-type="${t}" style="font-size:13px;padding:5px 12px">${t}</span>`).join(' ')}</div>
        ${p.size ? `<p style="font-size:13px;color:var(--dim)"><b>Tamaño:</b> ${p.size.cat} · <b>Altura:</b> ${p.size.h} m · <b>Peso:</b> ${p.size.w} kg</p>` : ''}
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

  renderMoves() {
    const tbody = document.getElementById('mov-tbody');
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
        <td><span class="tag" data-type="${m.type}">${m.type}</span></td>
        <td>${claseName[m.class] || m.class}</td>
        <td class="num">${m.db || '—'}</td>
        <td class="num">${m.ac ?? '—'}</td>
        <td style="font-size:12px">${m.range || '—'}</td>
        <td style="font-size:12px;max-width:280px">${m.effect || '—'}</td>
      </tr>`).join('');
  },

  renderAbilities() {
    const list = document.getElementById('ab-list');
    if (!list) return;
    const searchInp = document.getElementById('ab-search');
    const tipoSel = document.getElementById('ab-tipo');
    if (!searchInp.dataset.bound) {
      searchInp.dataset.bound = '1';
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
