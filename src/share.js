/* ============================================================
   share.js · Compartir, importar, exportar
   Importación segura: valida antes de tocar el estado.
   ============================================================ */
'use strict';

const Share = {
  PREFIX: 'PTU5-',

  init() {
    document.getElementById('share-gen').addEventListener('click', () => this._generate());
    document.getElementById('share-copy').addEventListener('click', () => this._copy());
    document.getElementById('share-load').addEventListener('click', () => this._loadActive());
    document.getElementById('share-load-dm').addEventListener('click', () => this._loadToDM());
    document.getElementById('file-export').addEventListener('click', () => this._exportFile());
    document.getElementById('file-import-btn').addEventListener('click', () =>
      document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', e => this._importFile(e));
    document.getElementById('restore-backup').addEventListener('click', () => this._restoreBackup());
    document.getElementById('dj-clear').addEventListener('click', () => {
      if (!confirm('¿Vaciar la vista del Narrador?')) return;
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
    code = String(code || '').trim();
    if (code.startsWith(this.PREFIX)) code = code.slice(this.PREFIX.length);
    let json;
    try {
      json = decodeURIComponent(escape(atob(code)));
    } catch (e) {
      throw new Error('El código no está bien formado.');
    }
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error('El código no contiene datos válidos.');
    }
    return parsed;
  },

  _generate() {
    const code = this._encode();
    document.getElementById('share-out').classList.remove('hide');
    document.getElementById('share-text').value = code;
  },

  async _copy() {
    const ta = document.getElementById('share-text');
    const ok = await Utils.copyToClipboard(ta.value);
    const okMsg = document.getElementById('share-copy-ok');
    if (ok) {
      okMsg.classList.remove('hide');
      setTimeout(() => okMsg.classList.add('hide'), 1500);
    } else {
      alert('No se pudo copiar automáticamente. Selecciona el texto y pulsa Ctrl+C.');
    }
  },

  _loadActive() {
    const code = document.getElementById('share-in').value;
    const msg = document.getElementById('share-in-msg');
    if (!code.trim()) { msg.innerHTML = '<div class="call warn">Pega un código primero.</div>'; return; }

    let parsed;
    try {
      parsed = this._decode(code);
    } catch (e) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Código inválido</span>${Utils.escapeHtml(e.message)}</div>`;
      return;
    }

    const v = Utils.validateImportedState(parsed);
    if (!v.ok) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Datos inválidos</span>${Utils.escapeHtml(v.error)}<br>La ficha anterior NO se ha modificado.</div>`;
      return;
    }

    if (!confirm('Esto reemplazará tu ficha actual. Se guardará una copia por si acaso.\n¿Continuar?')) {
      msg.innerHTML = '<div class="call warn">Importación cancelada.</div>';
      return;
    }

    // Snapshot antes de sustituir
    Storage.snapshotBeforeDangerous('import');

    const pokemons = v.data.pokemons.map(p => Object.assign(emptyPokemon(), p, { id: uid() }));
    if (!pokemons.length) pokemons.push(emptyPokemon());

    State = migrate({
      version: SCHEMA_VERSION,
      trainer: Object.assign(emptyTrainer(), v.data.trainer),
      pokemons,
      activePokemonId: pokemons[0].id,
      items: Object.assign({ ball: 0, pot: 0, rev: 0, ant: 0 }, v.data.items || {}),
      combat: { list: [], round: 1, currentIndex: 0 },
      dmSheets: State.dmSheets,
      updatedAt: Date.now()
    });

    persistForce();
    App.hydrate();
    if (typeof Wizard !== 'undefined' && Wizard._refreshPokemonSelectors) {
      Wizard._refreshPokemonSelectors();
    }
    if (typeof Wizard !== 'undefined' && Wizard._refresh) Wizard._refresh();

    msg.innerHTML = `<div class="call">
      <span class="lbl">Ficha importada</span>
      ${Utils.escapeHtml(State.trainer.name || 'Sin nombre')} ·
      Nv.${State.trainer.level} · ${State.pokemons.length} Pokémon.
      Se guardó una copia de tu ficha anterior por si quieres recuperarla.
    </div>`;
    UI.updateChip();
  },

  _loadToDM() {
    const code = document.getElementById('share-in').value;
    const msg = document.getElementById('share-in-msg');
    if (!code.trim()) { msg.innerHTML = '<div class="call warn">Pega un código primero.</div>'; return; }

    let parsed;
    try {
      parsed = this._decode(code);
    } catch (e) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Código inválido</span>${Utils.escapeHtml(e.message)}</div>`;
      return;
    }

    const v = Utils.validateImportedState(parsed);
    if (!v.ok) {
      msg.innerHTML = `<div class="call err"><span class="lbl">Datos inválidos</span>${Utils.escapeHtml(v.error)}</div>`;
      return;
    }

    const pokemons = v.data.pokemons.map(p => Object.assign(emptyPokemon(), p, { id: uid() }));

    State.dmSheets.push({
      id: uid(),
      name: v.data.trainer.name || 'Sin nombre',
      level: v.data.trainer.level,
      trainer: v.data.trainer,
      pokemons,
      items: v.data.items,
      importedAt: Date.now()
    });
    persist();

    msg.innerHTML = `<div class="call"><span class="lbl">Añadido a Vista del Narrador</span>
      ${Utils.escapeHtml(v.data.trainer.name || 'Sin nombre')} guardado para consulta.</div>`;
    document.getElementById('share-in').value = '';
    this.renderDJ();
  },

  _exportFile() {
    Storage.markExported();
    Utils.download((State.trainer.name || 'entrenador') + '.ptu',
      JSON.stringify(State, null, 2));
  },

  _importFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es demasiado grande (máximo 2 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(reader.result);
      } catch (err) {
        alert('Archivo no válido: ' + err.message);
        return;
      }

      // Validación de estructura básica
      if (!data || typeof data !== 'object' || !data.trainer || !Array.isArray(data.pokemons)) {
        alert('El archivo no contiene una ficha válida.');
        return;
      }

      if (!confirm('Esto reemplazará tu ficha actual. Se guardará una copia por si acaso.\n¿Continuar?')) return;

      Storage.snapshotBeforeDangerous('import-file');

      State = migrate(data);
      persistForce();
      App.hydrate();
      if (typeof Wizard !== 'undefined' && Wizard._refreshPokemonSelectors) {
        Wizard._refreshPokemonSelectors();
      }
      UI.updateChip();
      alert('Ficha cargada.');
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
    if (!confirm('Esto reemplazará tu ficha actual con la última copia guardada.\n¿Continuar?')) return;

    State = migrate(raw);
    persistForce();
    App.hydrate();
    if (typeof Wizard !== 'undefined' && Wizard._refreshPokemonSelectors) {
      Wizard._refreshPokemonSelectors();
    }
    UI.updateChip();

    const ts = Storage.backupTimestamp();
    const fecha = ts ? new Date(ts).toLocaleString() : 'fecha desconocida';
    msg.innerHTML = `<div class="call"><span class="lbl">Listo</span>Copia restaurada del ${Utils.escapeHtml(fecha)}.</div>`;
  },

  renderDJ() {
    const el = document.getElementById('djList');
    if (!el) return;
    document.getElementById('dj-count').textContent = State.dmSheets.length;
    if (!State.dmSheets.length) {
      el.innerHTML = '<div class="call info"><span class="lbl">Vacío</span>Ve a Compartir ficha → Importar, pega un código y pulsa <b>Añadir a Vista del Narrador</b>.</div>';
      return;
    }
    const esc = s => Utils.escapeHtml(s);
    el.innerHTML = State.dmSheets.map(sheet => {
      const t = sheet.trainer;
      const f = t.stats || {};
      const rows = sheet.pokemons.map(p => {
        const base = Data.pokemon(p.species);
        const stats = Pokemon._stats(p);
        const pg = p.level + stats.hp * 3 + 10;
        const tipos = base ? base.t.map(ty => `<span class="tag" data-type="${esc(ty)}" style="font-size:10px;padding:1px 6px">${esc(ty)}</span>`).join('') : '—';
        return `<tr>
          <td>${esc(p.nickname || base?.es || p.species)}</td>
          <td class="num">${esc(p.level)}</td>
          <td>${tipos}</td>
          <td class="num">${esc(p.hpCurrent ?? pg)}/${esc(pg)}</td>
        </tr>`;
      }).join('');
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <h3 style="margin:0">${esc(sheet.name)} <span style="color:var(--dim);font-weight:400;font-size:14px">· Nv.${esc(sheet.level)}</span></h3>
          <button class="btn r sm" data-dj-del="${esc(sheet.id)}">Quitar</button>
        </div>
        <div class="stats" style="margin-top:10px">
          <div class="stat"><b>PG</b><span>${esc(t.level * 2 + f.hp * 3 + 10)}</span></div>
          <div class="stat"><b>Salud</b><span>${esc(f.hp)}</span></div>
          <div class="stat"><b>Ataque</b><span>${esc(f.atk)}</span></div>
          <div class="stat"><b>Defensa</b><span>${esc(f.def)}</span></div>
          <div class="stat"><b>Velocidad</b><span>${esc(f.spe)}</span></div>
        </div>
        ${t.clase ? `<p style="margin-top:8px"><b>Clase:</b> ${esc(t.clase)}</p>` : ''}
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
