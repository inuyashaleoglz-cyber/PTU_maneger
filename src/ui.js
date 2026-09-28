/* ============================================================
   ui.js · Navegación con hash + modales con focus trap
   ============================================================ */
'use strict';

const UI = {
  currentView: 'inicio',
  _lastFocus: null,

  /** Cambia de vista. Actualiza URL, foco y dispara render. */
  show(viewId, opts = {}) {
    if (!viewId) viewId = 'inicio';

    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('on', v.id === 'view-' + viewId));
    document.querySelectorAll('.nav button').forEach(b =>
      b.classList.toggle('on', b.dataset.view === viewId));

    const titles = {
      inicio: 'Inicio', aprender: 'Aprende a jugar',
      crear: 'Crear entrenador', entrenador: 'Mi entrenador',
      pokemons: 'Mis Pokémon', clases: 'Clases', tracker: 'Combate',
      tools: 'Calculadoras', dados: 'Dados', compartir: 'Compartir ficha',
      dj: 'Vista del Narrador', tipos: 'Tipos', estados: 'Estados',
      reglas: 'Reglas', glosario: 'Glosario',
      pokedex: 'Pokédex', movimientos: 'Movimientos', habilidades: 'Habilidades'
    };
    document.getElementById('title').textContent = titles[viewId] || '';
    document.getElementById('side').classList.remove('open');

    // Actualizar hash para permitir enlaces y back/forward
    if (!opts.skipHash) {
      const newHash = '#/' + viewId;
      if (location.hash !== newHash) {
        try { history.pushState({ view: viewId }, '', newHash); }
        catch (e) { location.hash = newHash; }
      }
    }

    if (!opts.skipScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentView = viewId;

    // Disparadores de render
    if (viewId === 'aprender'    && typeof Reference !== 'undefined') Reference.renderLearn();
    if (viewId === 'entrenador'  && typeof Trainer   !== 'undefined') Trainer.render();
    if (viewId === 'pokemons'    && typeof Pokemon   !== 'undefined') Pokemon.showList();
    if (viewId === 'clases'      && typeof Trainer   !== 'undefined') Trainer.renderClasses();
    if (viewId === 'tracker'     && typeof Combat    !== 'undefined') Combat.render();
    if (viewId === 'dados'       && typeof Tools     !== 'undefined') Tools.renderSkillRolls();
    if (viewId === 'dj'          && typeof Share     !== 'undefined') Share.renderDJ();
    if (viewId === 'tipos'       && typeof Reference !== 'undefined') Reference.renderTypes();
    if (viewId === 'estados'     && typeof Reference !== 'undefined') Reference.renderStates();
    if (viewId === 'glosario'    && typeof Reference !== 'undefined') Reference.renderGlossary();
    if (viewId === 'pokedex'     && typeof Reference !== 'undefined') Reference.renderPokedex();
    if (viewId === 'movimientos' && typeof Reference !== 'undefined') Reference.renderMoves();
    if (viewId === 'habilidades' && typeof Reference !== 'undefined') Reference.renderAbilities();
  },

  /** Lee la URL y muestra la vista correspondiente. */
  showFromHash() {
    const hash = (location.hash || '').replace(/^#\/?/, '').trim();
    const valid = ['inicio','aprender','crear','entrenador','pokemons','clases',
      'tracker','tools','dados','compartir','dj','tipos','estados','reglas',
      'glosario','pokedex','movimientos','habilidades'];
    const view = valid.includes(hash) ? hash : 'inicio';
    this.show(view, { skipHash: true, skipScroll: true });
  },

  applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme');
    if (btn) btn.textContent = t === 'dark' ? '🌙' : '☀️';
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    Storage.setTheme(next);
    this.applyTheme(next);
  },

  updateChip() {
    const chip = document.getElementById('chipFicha');
    const t = State.trainer;
    if (!chip) return;
    if (t.name) {
      const pk = activePokemon();
      chip.textContent = `${t.name} · Nv.${t.level}${pk ? ' · ' + (pk.nickname || pk.species) : ''}`;
      chip.classList.add('g');
    } else {
      chip.textContent = 'Sin ficha';
      chip.classList.remove('g');
    }
    const badge = document.getElementById('pkCount');
    if (badge) {
      if (State.pokemons.length > 1) {
        badge.textContent = State.pokemons.length;
        badge.classList.remove('hide');
      } else {
        badge.classList.add('hide');
      }
    }
  },

  // ------------- Modales con focus trap -------------
  showModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (!el) return;
    this._lastFocus = document.activeElement;
    el.classList.remove('hide');

    // Mover foco al primer elemento enfocable dentro del modal
    const focusables = this._getFocusables(el);
    if (focusables.length) {
      setTimeout(() => focusables[0].focus(), 50);
    }

    // Activar focus trap
    el._focusHandler = (ev) => this._trapFocus(ev, el);
    el.addEventListener('keydown', el._focusHandler);
  },

  hideModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (!el) return;
    el.classList.add('hide');
    if (el._focusHandler) {
      el.removeEventListener('keydown', el._focusHandler);
      el._focusHandler = null;
    }
    // Devolver foco a donde estaba
    if (this._lastFocus && document.body.contains(this._lastFocus)) {
      try { this._lastFocus.focus(); } catch (e) {}
    }
    this._lastFocus = null;
  },

  _getFocusables(container) {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]),' +
      ' select:not([disabled]), textarea:not([disabled]),' +
      ' [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(sel))
      .filter(el => el.offsetParent !== null);
  },

  _trapFocus(ev, modal) {
    if (ev.key !== 'Tab') return;
    const focusables = this._getFocusables(modal);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (ev.shiftKey) {
      if (document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  },

  helpText(view) {
    const help = {
      inicio: '<p>Consulta libre o crea tu ficha. Si es tu primera vez, ve a <b>Aprende a jugar</b>.</p>',
      aprender: '<p>Explicaciones para quien nunca ha jugado un RPG de mesa. Léelo en orden.</p>',
      crear: '<p>El asistente te guía paso a paso. En cada paso puedes pulsar <b>Elige por mí</b>.</p>',
      entrenador: '<p>Tu ficha completa: historia, estadísticas, destrezas, clase y equipo.</p>',
      pokemons: '<p>Cada Pokémon de tu equipo. El <b>activo</b> aparece en la cabecera.</p>',
      clases: '<p>Todas las clases con sus requisitos.</p>',
      tracker: '<p>Lleva iniciativa, PG y PA de cada combatiente. Botón "Sincronizar" para aplicar cambios a las fichas.</p>',
      tools: '<p>Calculadoras: daño, captura y tabla de DB.</p>',
      dados: '<p>Haz clic en un dado para tirarlo.</p>',
      compartir: '<p>Genera un código de texto con tu ficha.</p>',
      dj: '<p>Para el Narrador: guarda las fichas de todos los jugadores.</p>',
      tipos: '<p>Tabla de efectividad de tipos.</p>',
      estados: '<p>Estados persistentes, volátiles y descanso.</p>',
      reglas: '<p>Resumen de reglas de combate, stats y progresión.</p>',
      glosario: '<p>Los términos de PTU explicados.</p>',
      pokedex: '<p>Consulta cualquier Pokémon con stats, habilidades y movimientos.</p>',
      movimientos: '<p>Lista completa de movimientos. Búsqueda tolerante a acentos.</p>',
      habilidades: '<p>Todas las habilidades con descripción.</p>'
    };
    return help[view] || '<p>Sin ayuda contextual.</p>';
  }
};

function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabs => {
    tabs.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === tab));
        const panel = tab.closest('.view') || tab.parentElement;
        panel.querySelectorAll('.tab-panel').forEach(p =>
          p.classList.toggle('on', p.dataset.panel === tab.dataset.tab));
      });
    });
  });
}
