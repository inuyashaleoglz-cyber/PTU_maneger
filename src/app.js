/* ============================================================
   app.js · Arranque + hash routing + SW + multi-pestaña
   ============================================================ */
'use strict';

const App = {
  async init() {
    UI.applyTheme(Storage.getTheme());
    document.getElementById('theme').addEventListener('click', () => UI.toggleTheme());
    document.getElementById('menu').addEventListener('click', () =>
      document.getElementById('side').classList.toggle('open'));

    document.querySelectorAll('.nav button').forEach(b =>
      b.addEventListener('click', () => UI.show(b.dataset.view)));
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) UI.show(go.dataset.go);
    });

    // Escuchar cambios de hash (back/forward del navegador)
    window.addEventListener('hashchange', () => UI.showFromHash());
    window.addEventListener('popstate', () => UI.showFromHash());

    document.getElementById('helpBtn').addEventListener('click', () => {
      document.getElementById('help-content').innerHTML = UI.helpText(UI.currentView);
      UI.showModal('help-backdrop');
    });
    document.getElementById('help-close').addEventListener('click', () =>
      UI.hideModal('help-backdrop'));
    document.getElementById('help-backdrop').addEventListener('click', e => {
      if (e.target.id === 'help-backdrop') UI.hideModal('help-backdrop');
    });

    const onbClose = () => {
      UI.hideModal('onb-backdrop');
      Storage.setOnboarded();
    };
    document.getElementById('onb-close').addEventListener('click', onbClose);
    ['onb-learn', 'onb-explore', 'onb-create'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', onbClose);
    });
    document.getElementById('onb-backdrop').addEventListener('click', e => {
      if (e.target.id === 'onb-backdrop') onbClose();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        ['onb-backdrop','example-backdrop','help-backdrop'].forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hide')) {
            if (id === 'onb-backdrop') onbClose();
            else UI.hideModal(id);
          }
        });
      }
    });

    document.getElementById('example-close').addEventListener('click', () =>
      UI.hideModal('example-backdrop'));
    document.getElementById('example-backdrop').addEventListener('click', e => {
      if (e.target.id === 'example-backdrop') UI.hideModal('example-backdrop');
    });
    document.getElementById('btnExampleTrainer')?.addEventListener('click', () => this.showExampleTrainer());
    document.getElementById('btnExamplePokemon')?.addEventListener('click', () => this.showExamplePokemon());

    document.getElementById('globalEmergencyExport')?.addEventListener('click', () => {
      Storage.markExported();
      Utils.download('ptu-emergencia-' + new Date().toISOString().slice(0,10) + '.ptu',
        JSON.stringify(State, null, 2));
    });

    initTabs();
    await Data.loadAll();
    this._hideLoader();
    this._checkDataWarnings();

    loadState();
    initMultiTabSync();

    Wizard.init();
    Combat.init();
    Tools.init();
    Share.init();

    this.hydrate();
    UI.updateChip();

    // Mostrar vista según hash actual
    UI.showFromHash();

    if (!Storage.hasOnboarded()) {
      UI.showModal('onb-backdrop');
    }

    // Registrar service worker
    this._registerSW();

    setInterval(() => persist(), 30000);
    window.addEventListener('beforeunload', () => persistForce());
  },

  _registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(() => console.log('SW registrado'))
        .catch(e => console.warn('SW no registrado:', e));
    }
  },

  onExternalUpdate() {
    this.hydrate();
    UI.updateChip();
    const v = UI.currentView;
    if (v === 'entrenador' && typeof Trainer !== 'undefined') Trainer.render();
    if (v === 'pokemons' && typeof Pokemon !== 'undefined') Pokemon.showList();
    if (v === 'tracker' && typeof Combat !== 'undefined') Combat.render();
    if (v === 'dj' && typeof Share !== 'undefined') Share.renderDJ();
    this._flashNotification('Otra pestaña actualizó la ficha. Datos recargados.');
  },

  notifyConflict() {
    this.hydrate();
    UI.updateChip();
    this._flashNotification('Otra pestaña tenía datos más recientes. Se recargaron.');
  },

  _flashNotification(text) {
    const el = document.getElementById('globalNotify');
    const txt = document.getElementById('globalNotifyText');
    if (!el || !txt) return;
    txt.textContent = text;
    el.classList.remove('hide');
    clearTimeout(this._notifyTimer);
    this._notifyTimer = setTimeout(() => el.classList.add('hide'), 4000);
  },

  _hideLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 400);
    }
  },

  _checkDataWarnings() {
    const failed = Data.loadStatus.failed;
    if (!failed.length) return;
    const box = document.getElementById('warnData');
    const text = document.getElementById('warnDataText');
    if (!box || !text) return;
    text.textContent = 'No se pudieron cargar ' + failed.length +
      ' archivo(s) de datos: ' + failed.map(f => f.path).join(', ') +
      '. Algunas secciones pueden verse incompletas. Recarga la página.';
    box.classList.remove('hide');
  },

  showExampleTrainer() {
    const el = document.getElementById('example-content');
    el.innerHTML = `
      <h2 style="margin-top:0">Kai · Entrenador de ejemplo</h2>
      <p style="color:var(--dim)">Ficha de nivel 5 solo para mirar.</p>
      <h3>Identidad</h3>
      <p><b>Nombre:</b> Kai<br><b>Concepto:</b> Joven que creció en un pueblo pesquero y ahora viaja con su Charmander</p>
      <h3>Estadísticas</h3>
      <div class="stats">
        <div class="stat"><b>Salud</b><span>12</span></div>
        <div class="stat"><b>Ataque</b><span>6</span></div>
        <div class="stat"><b>Defensa</b><span>7</span></div>
        <div class="stat"><b>At. Esp.</b><span>5</span></div>
        <div class="stat"><b>Def. Esp.</b><span>5</span></div>
        <div class="stat"><b>Velocidad</b><span>9</span></div>
      </div>
      <div class="stats" style="margin-top:8px">
        <div class="stat"><b>PG</b><span>56</span></div>
        <div class="stat"><b>PA</b><span>6</span></div>
      </div>
      <h3>Destrezas</h3>
      <p><b>Adepto:</b> Supervivencia<br><b>Novato:</b> Combate<br>
      <b>Patéticas:</b> Educación en Tecnología, Educación en Ocultismo, Astucia</p>
      <h3>Ventajas</h3>
      <p>Atletismo, Acrobacias, Percepción, Encanto</p>
      <h3>Clase</h3>
      <p>Entrenador Estrella</p>
      <h3>Pokémon</h3>
      <p><b>Charmander</b> · Nv.5 · <span class="tag" data-type="Fuego">Fuego</span><br>
      PG: 27 · Habilidad: Cuerpo Llama<br>
      Movimientos: Arañazo, Gruñido, Ascuas</p>
      <h3>Equipo</h3>
      <p>5 Poké Balls · 3 Pociones · 1 Revivir</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn" data-go="crear" id="ex-to-create">✨ Crear mi propia ficha</button>
      </div>`;
    UI.showModal('example-backdrop');
    document.getElementById('ex-to-create')?.addEventListener('click', () => {
      UI.hideModal('example-backdrop');
      UI.show('crear');
    });
  },

  showExamplePokemon() {
    const el = document.getElementById('example-content');
    el.innerHTML = `
      <h2 style="margin-top:0">Charmander · Pokémon de ejemplo</h2>
      <p style="color:var(--dim)">Ficha de nivel 5 solo para mirar.</p>
      <h3>Datos base</h3>
      <p><b>Especie:</b> Charmander<br>
      <b>Tipo:</b> <span class="tag" data-type="Fuego">Fuego</span><br>
      <b>Nivel:</b> 5</p>
      <h3>Estadísticas</h3>
      <div class="stats">
        <div class="stat"><b>Salud</b><span>4</span></div>
        <div class="stat"><b>Ataque</b><span>7</span></div>
        <div class="stat"><b>Defensa</b><span>4</span></div>
        <div class="stat"><b>At. Esp.</b><span>6</span></div>
        <div class="stat"><b>Def. Esp.</b><span>5</span></div>
        <div class="stat"><b>Velocidad</b><span>5</span></div>
      </div>
      <h3>Habilidad</h3>
      <p><b>Cuerpo Llama</b> — Contacto: 30% de quemar al atacante.</p>
      <h3>Movimientos</h3>
      <ul style="padding-left:20px">
        <li><b>Arañazo</b> · Normal · Físico · DB 2 · AC 2</li>
        <li><b>Gruñido</b> · Normal · Estado · AC 2</li>
        <li><b>Ascuas</b> · Fuego · Especial · DB 4 · AC 2</li>
      </ul>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn" data-go="pokedex" id="ex-to-dex">📕 Explorar Pokédex</button>
      </div>`;
    UI.showModal('example-backdrop');
    document.getElementById('ex-to-dex')?.addEventListener('click', () => {
      UI.hideModal('example-backdrop');
      UI.show('pokedex');
    });
  },

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
    document.querySelectorAll('#w-weak input').forEach(cb => cb.checked = t.weak.includes(cb.value));
    document.querySelectorAll('#w-edges input').forEach(cb => cb.checked = t.edges.includes(cb.value));

    if (typeof Wizard !== 'undefined' && Wizard.hydrateStatsFromState) {
      Wizard.hydrateStatsFromState();
    }

    const p = State.pokemons[0];
    if (p) {
      set('w-esp', p.species);
      set('w-nivel-pk', p.level);
      set('w-nat', p.nature);
      document.querySelectorAll('#w-ppoints input').forEach(i =>
        i.value = p.points[i.dataset.pk] || 0);
    }
    Object.entries({ 'b-ball':'ball', 'b-pot':'pot', 'b-rev':'rev', 'b-ant':'ant' })
      .forEach(([id, key]) => set(id, State.items[key] || 0));

    if (typeof Wizard !== 'undefined') {
      Wizard._updateBudget?.();
      Wizard._refresh?.();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
