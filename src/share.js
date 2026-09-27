/* ============================================================
   share.js · Códigos de compartir, archivos .ptu, vista DJ
   ============================================================ */
'use strict';

const Share = {
  PREFIX: 'PTU5-',

  init() {
    // Generar
    document.getElementById('share-gen').addEventListener('click', () => this._generate());
    document.getElementById('share-copy').addEventListener('click', () => this._copy());
    // Importar
    document.getElementById('share-load').addEventListener('click', () => this._loadActive());
    document.getElementById('share-load-dm').addEventListener('click', () => this._loadToDM());
    // Archivo
    document.getElementById('file-export').addEventListener('click', () => this._exportFile());
    document.getElementById('file-import-btn').addEventListener('click', () =>
      document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', e => this._importFile(e));
    // Backup
    document.getElementById('restore-backup').addEventListener('click', () => this._restoreBackup());
    // DJ
    document.getElementById('dj-clear').addEventListener('click', () => {
      if (!confirm('¿Vaciar la vista DJ?')) return;
      State.dmSheets = []; persist(); this.renderDJ();
    });
  },

  _encode() {
    const payload = {
      t: State.trainer,
      p: State.pokemons.map(p => ({
        species: p.species, nickname: p.nickname, level: p.level, nature: p.nature,
        points: p.points, ability: p.ability, moves: p.moves,
        hpCurrent: p.hpCurrent, heridas: p.heridas, exp: p.exp,
        notes: p.notes
      })),
      items: State.items
    };
    const json = JSON.stringify(payload);
    return this.PREFIX + btoa(unescape(encodeURIComponent(json)));
  },

  _decode(code) {
    code = code.trim();
    if (code.startsWith(this.PREFIX)) code = code.slice(this.PREFIX.length);
    const json = decodeURIComponent(escape(atob(code)));
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.t) throw new Error('Estructura no reconocida');
    const pokemons = (parsed.p || []).map(p => Object.assign(emptyPokemon(), p, { id: uid() }));
    if (!pokemons.length) pokemons.push(emptyPokemon());
    return {
      version: SCHEMA_VERSION,
      trainer: Object.assign(emptyTrainer(), parsed.t),
      pokemons,
      activePokemonId: pokemons[0].id,
      items: Object.assign({ ball: 0, pot: 0, rev: 0, ant: 0 }, parsed.items || {}),
      combat: { list: [], round: 1, currentIndex: 0 },
      dmSheets: State.dmSheets,
      updatedAt: Date.now()
    };
  },

  _generate() {
    const code = this._encode();
    document.getElementById('share-out').classList.remove('hide');
    document.getElementById('share-text').value = code;
  },

  async _copy() {
    const ta = document.getElementById('share-text');
    ta.select();
    try {
      await navigator.clipboard.writeText(ta.value);
    } catch (e) {
      document.execCommand('copy');
    }
    const ok = document.getElementById('share-copy-ok');
    ok.classList.remove('hide');
    setTimeout(() => ok.classList.add('hide'), 1500);
  },

  _loadActive() {
    const code = document.getElementById('share-in').value;
    const msg = document.getElementById('share-in-msg');
    if (!code.trim()) { msg.innerHTML = '<div class="call warn">Pega un código primero.</div>'; return; }
    try {
      const imported = this._decode(code);
      State = imported;
      persist();
      // Rehidratar inputs del wizard
      App.hydrate();
      msg.innerHTML = `<div class="call"><span class="lbl">Ficha importada</span>
        ${State.trainer.name || 'Sin nombre'} · Nv.${State.trainer.level} · ${State.pokemons.length} Pokémon.</div>`;
      UI.updateChip();
    } catch (e) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Error</span>${e.message}</div>`;
    }
  },

  _loadToDM() {
    const code = document.getElementById('share-in').value;
    const msg = document.getElementById('share-in-msg');
    if (!code.trim()) { msg.innerHTML = '<div class="call warn">Pega un código primero.</div>'; return; }
    try {
      const imported = this._decode(code);
      State.dmSheets.push({
        id: uid(),
        name: imported.trainer.name || 'Sin nombre',
        level: imported.trainer.level,
        trainer: imported.trainer,
        pokemons: imported.pokemons,
        items: imported.items,
        importedAt: Date.now()
      });
      persist();
      msg.innerHTML = `<div class="call"><span class="lbl">Añadido a Vista DJ</span>
        ${imported.trainer.name || 'Sin nombre'} guardado para consulta.</div>`;
      document.getElementById('share-in').value = '';
      this.renderDJ();
    } catch (e) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Error</span>${e.message}</div>`;
    }
  },

  _exportFile() {
    const blob = new Blob([JSON.stringify(State, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (State.trainer.name || 'entrenador') + '.ptu';
    a.click();
    URL.revokeObjectURL(a.href);
  },

  _importFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        State = migrate(data);
        persist(); App.hydrate(); UI.updateChip();
        alert('Ficha cargada.');
      } catch (err) {
        alert('Archivo no válido: ' + err.message);
      }
    };
    reader.readAsText(file);
  },

  _restoreBackup() {
    const raw = Storage.restoreBackup();
    const msg = document.getElementById('restore-msg');
    if (!raw) {
      msg.innerHTML = '<div class="call warn"><span class="lbl">Sin copia</span>No hay copia de seguridad disponible.</div>';
      return;
    }
    State = migrate(raw);
    persist(); App.hydrate(); UI.updateChip();
    msg.innerHTML = '<div class="call"><span class="lbl">Listo</span>Copia restaurada.</div>';
  },

  renderDJ() {
    const el = document.getElementById('djList');
    if (!el) return;
    document.getElementById('dj-count').textContent = State.dmSheets.length;

    if (!State.dmSheets.length) {
      el.innerHTML = '<div class="call info"><span class="lbl">Vacío</span>Ve a Compartir ficha → Importar, pega un código y pulsa <b>Añadir a Vista DJ</b>.</div>';
      return;
    }

    el.innerHTML = State.dmSheets.map(sheet => {
      const t = sheet.trainer;
      const f = t.stats || {};
      const rows = sheet.pokemons.map(p => {
        const base = Data.pokemon(p.species);
        const stats = Pokemon._stats(p);
        const pg = p.level + stats.hp * 3 + 10;
        return `<tr>
          <td>${p.nickname || base?.es || p.species}</td>
          <td class="num">${p.level}</td>
          <td>${base ? base.t.join('/') : '—'}</td>
          <td class="num">${p.hpCurrent ?? pg}/${pg}</td>
        </tr>`;
      }).join('');

      return `<div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <h3 style="margin:0">${sheet.name} <span style="color:var(--dim);font-weight:400;font-size:14px">· Nv.${sheet.level}</span></h3>
          <button class="btn r sm" data-dj-del="${sheet.id}">Quitar</button>
        </div>
        <div class="stats" style="margin-top:10px">
          <div class="stat"><b>PG</b><span>${t.level * 2 + f.hp * 3 + 10}</span></div>
          <div class="stat"><b>Salud</b><span>${f.hp}</span></div>
          <div class="stat"><b>Ataque</b><span>${f.atk}</span></div>
          <div class="stat"><b>Defensa</b><span>${f.def}</span></div>
          <div class="stat"><b>Velocidad</b><span>${f.spe}</span></div>
        </div>
        ${t.clase ? `<p style="margin-top:8px"><b>Clase:</b> ${t.clase}</p>` : ''}
        <h4>Pokémon (${sheet.pokemons.length})</h4>
        <div class="tw"><table>
          <thead><tr><th>Nombre</th><th>Nivel</th><th>Tipo</th><th class="num">PG</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </div>`;
    }).join('');

    el.querySelectorAll('[data-dj-del]').forEach(b => {
      b.addEventListener('click', () => {
        if (!confirm('¿Quitar esta ficha?')) return;
        State.dmSheets = State.dmSheets.filter(x => x.id !== b.dataset.djDel);
        persist(); this.renderDJ();
      });
    });
  }
};