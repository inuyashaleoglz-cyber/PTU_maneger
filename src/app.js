/* ============================================================
   app.js · Arranque y enlaces globales
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

    document.getElementById('helpBtn').addEventListener('click', () => {
      document.getElementById('help-content').innerHTML = UI.helpText(UI.currentView);
      UI.showModal('help-backdrop');
    });
    document.getElementById('help-close').addEventListener('click', () =>
      UI.hideModal('help-backdrop'));
    document.getElementById('help-backdrop').addEventListener('click', e => {
      if (e.target.id === 'help-backdrop') UI.hideModal('help-backdrop');
    });

    // Modal de bienvenida
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
        const back = document.getElementById('onb-backdrop');
        if (back && !back.classList.contains('hide')) onbClose();
        const eb = document.getElementById('example-backdrop');
        if (eb && !eb.classList.contains('hide')) UI.hideModal('example-backdrop');
      }
    });

    // Modal de ejemplo
    document.getElementById('example-close').addEventListener('click', () =>
      UI.hideModal('example-backdrop'));
    document.getElementById('example-backdrop').addEventListener('click', e => {
      if (e.target.id === 'example-backdrop') UI.hideModal('example-backdrop');
    });

    // Botones de ejemplo
    document.getElementById('btnExampleTrainer')?.addEventListener('click', () => this.showExampleTrainer());
    document.getElementById('btnExamplePokemon')?.addEventListener('click', () => this.showExamplePokemon());

    initTabs();
    await Data.loadAll();
    loadState();

    Wizard.init();
    Combat.init();
    Tools.init();
    Share.init();

    this.hydrate();
    UI.updateChip();

    if (!Storage.hasOnboarded()) {
      UI.showModal('onb-backdrop');
    }

    setInterval(() => persist(), 30000);
    window.addEventListener('beforeunload', () => persist());

    UI.show('inicio');
  },

  showExampleTrainer() {
    const el = document.getElementById('example-content');
    el.innerHTML = `
      <h2 style="margin-top:0">Kai · Entrenador de ejemplo</h2>
      <p style="color:var(--dim)">Este es un entrenador de nivel 5. Se muestra solo para que veas cómo se ve una ficha completa.</p>

      <h3>Identidad</h3>
      <p><b>Nombre:</b> Kai<br>
      <b>Concepto:</b> Joven que creció en un pueblo pesquero y ahora viaja con su Charmander</p>

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
      <p><b>Adepto:</b> Supervivencia<br>
      <b>Novato:</b> Combate<br>
      <b>Patéticas:</b> Educación en Tecnología, Educación en Ocultismo, Astucia</p>

      <h3>Ventajas (Edges)</h3>
      <p>Atletismo, Acrobacias, Percepción, Encanto (todas a Novato)</p>

      <h3>Clase</h3>
      <p>Entrenador Estrella</p>

      <h3>Pokémon</h3>
      <p><b>Charmander</b> · Nv.5 · Fuego<br>
      PG: 27 · Habilidad: Cuerpo Llama<br>
      Movimientos: Arañazo, Gruñido, Ascuas</p>

      <h3>Equipo</h3>
      <p>5 Poké Balls · 3 Pociones · 1 Revivir</p>

      <div class="call info" style="margin-top:14px">
        <span class="lbl">¿Y ahora qué?</span>
        Cuando hagas la tuya, tendrás algo parecido. No tiene que ser perfecta: se puede editar todo después.
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn" data-go="crear" id="ex-to-create">✨ Crear mi propia ficha</button>
      </div>
    `;
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
      <p style="color:var(--dim)">Así se ve la ficha de un Pokémon de nivel 5.</p>

      <h3>Datos base</h3>
      <p><b>Especie:</b> Charmander<br>
      <b>Tipo:</b> Fuego<br>
      <b>Nivel:</b> 5<br>
      <b>Naturaleza:</b> Valiente (+Ataque, −Velocidad)</p>

      <h3>Estadísticas</h3>
      <div class="stats">
        <div class="stat"><b>Salud</b><span>4</span><small>base 4</small></div>
        <div class="stat"><b>Ataque</b><span>7</span><small>base 5</small></div>
        <div class="stat"><b>Defensa</b><span>4</span><small>base 4</small></div>
        <div class="stat"><b>At. Esp.</b><span>6</span><small>base 6</small></div>
        <div class="stat"><b>Def. Esp.</b><span>5</span><small>base 5</small></div>
        <div class="stat"><b>Velocidad</b><span>5</span><small>base 7</small></div>
      </div>
      <div class="stats" style="margin-top:8px">
        <div class="stat"><b>PG</b><span>27</span></div>
      </div>

      <h3>Habilidad</h3>
      <p><b>Cuerpo Llama</b> — Cuando un enemigo te golpea con un movimiento de contacto, tira 1d10. Con 8+ el atacante queda Quemado.</p>

      <h3>Movimientos</h3>
      <ul style="padding-left:20px">
        <li><b>Arañazo</b> · Normal · Físico · DB 2 · AC 2</li>
        <li><b>Gruñido</b> · Normal · Estado · AC 2 · Baja 1 Ataque al enemigo</li>
        <li><b>Ascuas</b> · Fuego · Especial · DB 4 · AC 2 · Puede quemar (18+)</li>
      </ul>

      <div class="call info" style="margin-top:14px">
        <span class="lbl">Cómo se lee</span>
        Cada movimiento tiene <b>DB</b> (cuánto daño base hace), <b>AC</b> (qué tan difícil es acertar) y un <b>tipo</b>.
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
        <button class="btn" data-go="pokedex" id="ex-to-dex">📕 Explorar Pokédex</button>
      </div>
    `;
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
    const BASE = { hp: 10, atk: 5, def: 5, spa: 5, spd: 5, spe: 5 };
    Object.entries({ 'w-hp':'hp', 'w-atk':'atk', 'w-def':'def', 'w-spa':'spa', 'w-spd':'spd', 'w-spe':'spe' })
      .forEach(([id, key]) => set(id, (t.stats[key] || BASE[key]) - BASE[key]));
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
      Wizard._updateTrainerStats?.();
      Wizard._updateBudget?.();
      Wizard._refresh?.();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
