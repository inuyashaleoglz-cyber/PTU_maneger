/* ============================================================
   app.js · Arranque y enlaces globales
   ============================================================ */
'use strict';

const App = {
  async init() {
    // Tema
    UI.applyTheme(Storage.getTheme());
    document.getElementById('theme').addEventListener('click', () => UI.toggleTheme());

    // Menú móvil
    document.getElementById('menu').addEventListener('click', () =>
      document.getElementById('side').classList.toggle('open'));

    // Navegación
    document.querySelectorAll('.nav button').forEach(b =>
      b.addEventListener('click', () => UI.show(b.dataset.view)));
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) UI.show(go.dataset.go);
    });

    // Ayuda
    document.getElementById('helpBtn').addEventListener('click', () => {
      document.getElementById('help-content').innerHTML = UI.helpText(UI.currentView);
      UI.showModal('help-backdrop');
    });
    document.getElementById('help-close').addEventListener('click', () =>
      UI.hideModal('help-backdrop'));
    document.getElementById('help-backdrop').addEventListener('click', e => {
      if (e.target.id === 'help-backdrop') UI.hideModal('help-backdrop');
    });
    document.getElementById('openHelp')?.addEventListener('click', () => {
      document.getElementById('help-content').innerHTML = UI.helpText('inicio');
      UI.showModal('help-backdrop');
    });

    // Tabs genéricos
    initTabs();

    // Cargar catálogos JSON
    await Data.loadAll();

    // Cargar estado guardado
    loadState();

    // Inicializar módulos
    Wizard.init();
    Combat.init();
    Tools.init();
    Share.init();

    // Hidratar desde el estado
    this.hydrate();
    UI.updateChip();

    // Onboarding la primera vez
    if (!Storage.hasOnboarded()) {
      UI.showModal('onb-backdrop');

      const closeOnb = () => {
        UI.hideModal('onb-backdrop');
        Storage.setOnboarded();
      };

      document.getElementById('onb-close').addEventListener('click', closeOnb);
      document.getElementById('onb-go').addEventListener('click', () => {
        closeOnb();
        UI.show('crear');
      });
      // Cerrar también al hacer clic fuera del modal
      document.getElementById('onb-backdrop').addEventListener('click', e => {
        if (e.target.id === 'onb-backdrop') closeOnb();
      });
      // Y con Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          const back = document.getElementById('onb-backdrop');
          if (back && !back.classList.contains('hide')) closeOnb();
        }
      });
    }

    // Guardar cada 30 s por seguridad
    setInterval(() => persist(), 30000);
    window.addEventListener('beforeunload', () => persist());

    // Vista inicial
    UI.show('inicio');
  },

  /** Vuelca el estado a los inputs del wizard y las vistas. */
  hydrate() {
    const t = State.trainer;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

    set('w-nombre', t.name);
    set('w-nivel', t.level);
    set('w-concepto', t.concept);
    set('w-historia', t.story);
    set('w-adept', t.adept);
    set('w-novice', t.novice);
    set('w-clase', t.clase);
    set('w-train', t.training);

    // Checks
    document.querySelectorAll('#w-weak input').forEach(cb =>
      cb.checked = t.weak.includes(cb.value));
    document.querySelectorAll('#w-edges input').forEach(cb =>
      cb.checked = t.edges.includes(cb.value));

    // Stats del entrenador (inverso)
    const BASE = { hp: 10, atk: 5, def: 5, spa: 5, spd: 5, spe: 5 };
    Object.entries({ 'w-hp':'hp', 'w-atk':'atk', 'w-def':'def', 'w-spa':'spa', 'w-spd':'spd', 'w-spe':'spe' })
      .forEach(([id, key]) => set(id, (t.stats[key] || BASE[key]) - BASE[key]));

    // Pokémon inicial
    const p = State.pokemons[0];
    if (p) {
      set('w-esp', p.species);
      set('w-nivel-pk', p.level);
      set('w-nat', p.nature);
      set('w-hab', p.ability);
      set('w-movs', p.moves);
      document.querySelectorAll('#w-ppoints input').forEach(i =>
        i.value = p.points[i.dataset.pk] || 0);
    }

    // Items
    Object.entries({ 'b-ball':'ball', 'b-pot':'pot', 'b-rev':'rev', 'b-ant':'ant' })
      .forEach(([id, key]) => set(id, State.items[key] || 0));

    // Disparar refresco del wizard
    if (typeof Wizard !== 'undefined') {
      Wizard._updateTrainerStats?.();
      Wizard._updateBudget?.();
      Wizard._refresh?.();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());