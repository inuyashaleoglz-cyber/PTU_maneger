/* ============================================================
   ui.js · Navegación, tema, modales, tabs
   ============================================================ */
'use strict';

const UI = {
  currentView: 'inicio',

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
      reglas: 'Reglas', glosario: 'Glosario',
      pokedex: 'Pokédex', movimientos: 'Movimientos', habilidades: 'Habilidades'
    };
    document.getElementById('title').textContent = titles[viewId] || '';
    document.getElementById('side').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentView = viewId;

    // Disparadores de render por vista
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

  showModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.remove('hide');
  },

  hideModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) el.classList.add('hide');
  },

  helpText(view) {
    const help = {
      inicio: '<p>Consulta todo desde el menú lateral. Si vas a jugar, empieza por <b>Crear entrenador</b>.</p>',
      crear: '<p>El asistente te guía paso a paso. Nada es permanente: al terminar puedes editar todo desde <b>Mi entrenador</b>.</p>',
      entrenador: '<p>Aquí ves tu ficha completa. Los valores se calculan solos.</p>',
      pokemons: '<p>Cada Pokémon de tu equipo tiene su ficha. El <b>activo</b> es el que aparece en la cabecera.</p>',
      clases: '<p>Todas las clases con sus requisitos. Las que cumples aparecen marcadas con ✓.</p>',
      tracker: '<p>Lleva iniciativa, PG y PA de cada combatiente.</p>',
      tools: '<p>Calculadoras: daño, captura y tabla de DB.</p>',
      dados: '<p>Haz clic en un dado para tirarlo.</p>',
      compartir: '<p>Genera un código de texto con tu ficha para pegarlo en el chat del grupo.</p>',
      dj: '<p>Vista para el DJ: guarda aquí las fichas de tus jugadores.</p>',
      tipos: '<p>Tabla de efectividad de tipos.</p>',
      estados: '<p>Estados persistentes, volátiles y descanso.</p>',
      reglas: '<p>Resumen de reglas de combate, stats y progresión.</p>',
      glosario: '<p>Los términos de PTU explicados en una línea.</p>',
      pokedex: '<p>Consulta cualquier Pokémon con sus stats, tipos, habilidades y movimientos. No necesitas tener una ficha.</p>',
      movimientos: '<p>Lista completa de movimientos con DB, AC, tipo, clase, rango y efecto.</p>',
      habilidades: '<p>Todas las habilidades con su descripción breve y completa.</p>'
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
