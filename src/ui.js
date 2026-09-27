/* ============================================================
   ui.js · Navegación, tema, modales, tabs
   ============================================================ */
'use strict';

const UI = {
  currentView: 'inicio',

  /** Cambia de sección. */
  show(viewId) {
    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('on', v.id === 'view-' + viewId));
    document.querySelectorAll('.nav button').forEach(b =>
      b.classList.toggle('on', b.dataset.view === viewId));

    const titles = {
      inicio: 'Inicio', crear: 'Crear entrenador', entrenador: 'Mi entrenador',
      pokemons: 'Mis Pokémon', clases: 'Clases', tracker: 'Combate',
      tools: 'Calculadoras', dados: 'Dados', compartir: 'Compartir ficha',
      dj: 'Vista DJ', tipos: 'Tipos', estados: 'Estados',
      reglas: 'Reglas', glosario: 'Glosario'
    };
    document.getElementById('title').textContent = titles[viewId] || '';
    document.getElementById('side').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentView = viewId;

    // Disparadores de render por vista (llamadas directas, sin window.)
    if (viewId === 'entrenador' && typeof Trainer !== 'undefined')   Trainer.render();
    if (viewId === 'pokemons'   && typeof Pokemon !== 'undefined')   Pokemon.showList();
    if (viewId === 'clases'     && typeof Trainer !== 'undefined')   Trainer.renderClasses();
    if (viewId === 'tracker'    && typeof Combat !== 'undefined')    Combat.render();
    if (viewId === 'dados'      && typeof Tools !== 'undefined')     Tools.renderSkillRolls();
    if (viewId === 'dj'         && typeof Share !== 'undefined')     Share.renderDJ();
    if (viewId === 'tipos'      && typeof Reference !== 'undefined') Reference.renderTypes();
    if (viewId === 'estados'    && typeof Reference !== 'undefined') Reference.renderStates();
    if (viewId === 'glosario'   && typeof Reference !== 'undefined') Reference.renderGlossary();
  },

  /** Aplica el tema claro u oscuro. */
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

  /** Actualiza el chip de la cabecera con el nombre de la ficha. */
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
    // Badge del menú
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

  /** Modal genérico. */
  showModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.remove('hide');
  },

  hideModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.add('hide');
  },

  /** Texto de ayuda contextual según la vista activa. */
  helpText(view) {
    const help = {
      inicio: '<p>Esta es la pantalla de inicio. Desde aquí puedes ir a cualquier parte usando el menú de la izquierda (o el botón ☰ en el móvil).</p><p>Si es tu primera vez, empieza por <b>Crear entrenador</b>.</p>',
      crear: '<p>El asistente te guía paso a paso. Puedes volver atrás sin perder lo que llevas escrito.</p><p>Nada es permanente: al terminar puedes editar cualquier cosa desde <b>Mi entrenador</b>.</p>',
      entrenador: '<p>Aquí ves tu ficha completa. Los valores se calculan solos: PG, PA y evasiones se derivan de tus estadísticas.</p><p>Puedes tirar cualquier destreza haciendo clic en <b>Tirar</b>.</p>',
      pokemons: '<p>Cada Pokémon de tu equipo tiene su propia ficha. El que marques como <b>activo</b> es el que aparece en la cabecera y en el combate.</p>',
      clases: '<p>Las clases son caminos de especialización. Cada una tiene requisitos de nivel y destrezas. Solo puedes tomar las que cumplas.</p>',
      tracker: '<p>Aquí llevas el orden de iniciativa, los PG y los PA de cada combatiente. <b>+ Mi entrenador</b> y <b>+ Mi equipo</b> toman los valores de tu ficha.</p>',
      tools: '<p>Tres calculadoras: daño (DB + stat − defensa × tipo), captura (tasa base con modificadores) y tabla de referencia de DB.</p>',
      dados: '<p>Haz clic en cualquier dado para tirarlo. Las tiradas desde tu ficha usan tus rangos de destreza actuales.</p>',
      compartir: '<p>Todo funciona offline. Para compartir con tu grupo, genera un <b>código de texto</b> y pégalo en el chat. Cualquiera puede importarlo.</p>',
      dj: '<p>Vista para el DJ: guarda aquí las fichas de tus jugadores para consultarlas todas juntas.</p>',
      tipos: '<p>Haz clic en un tipo de ataque para ver contra qué tipos es eficaz, resistido o inmune.</p>',
      estados: '<p>Referencia rápida de estados persistentes, volátiles y reglas de descanso.</p>',
      reglas: '<p>Resumen de las reglas más usadas en mesa. Para profundizar, consulta el manual.</p>',
      glosario: '<p>Los términos que más se repiten en PTU, explicados en una línea. Puedes buscar arriba.</p>'
    };
    return help[view] || '<p>Sin ayuda contextual para esta pantalla.</p>';
  }
};

/** Tabs genéricos (funcionan con cualquier contenedor .tabs). */
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