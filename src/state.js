/* ============================================================
   state.js · Estado global + multi-pestaña
   Detecta cambios de otras pestañas y evita pisar datos recientes.
   ============================================================ */
'use strict';

const SCHEMA_VERSION = 3;
const STATE_CHANNEL = 'ptu-manager-sync';

let _bc = null;      // BroadcastChannel
let _lastLocalEdit = 0;

function emptyState() {
  const pk = emptyPokemon();
  return {
    version: SCHEMA_VERSION,
    trainer: emptyTrainer(),
    pokemons: [pk],
    activePokemonId: pk.id,
    items: { ball: 0, pot: 0, rev: 0, ant: 0 },
    combat: { list: [], round: 1, currentIndex: 0 },
    dmSheets: [],
    updatedAt: Date.now()
  };
}

function emptyTrainer() {
  return {
    name: '', concept: '', story: '', level: 1, exp: 0,
    adept: 'Educación Pokémon', novice: 'Combate', weak: [],
    edges: [], clase: '',
    training: 'Entrenamiento de Agilidad',
    stats: { hp: 14, atk: 5, def: 8, spa: 5, spd: 5, spe: 8 }
  };
}

function emptyPokemon() {
  return {
    id: uid(),
    species: 'Bulbasaur',
    nickname: '',
    level: 5,
    nature: 0,
    points: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ability: '',
    moves: '',
    hpCurrent: null,
    heridas: 0,
    exp: 0,
    notes: '',
    tutorPoints: 0
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function migrate(s) {
  if (!s || typeof s !== 'object') return emptyState();

  if (!s.version || s.version < 2) {
    if (s.pokemon && !s.pokemons) {
      const p = Object.assign(emptyPokemon(), s.pokemon, { id: uid() });
      s.pokemons = [p];
      s.activePokemonId = p.id;
      delete s.pokemon;
    }
    s.version = 2;
  }

  if (s.version < 3) {
    if (!s.trainer.exp) s.trainer.exp = 0;
    if (!Array.isArray(s.dmSheets)) s.dmSheets = [];
    s.version = 3;
  }

  if (s.trainer && s.trainer.training) {
    const map = {
      agilidad: 'Entrenamiento de Agilidad',
      enfocado: 'Entrenamiento Enfocado',
      brutal: 'Entrenamiento Brutal',
      inspirador: 'Entrenamiento Inspirador'
    };
    if (map[s.trainer.training]) s.trainer.training = map[s.trainer.training];
  }

  // Saneamiento defensivo
  if (!s.trainer) s.trainer = emptyTrainer();
  if (!Array.isArray(s.trainer.weak)) s.trainer.weak = [];
  if (!Array.isArray(s.trainer.edges)) s.trainer.edges = [];
  if (!s.trainer.stats) s.trainer.stats = { hp: 14, atk: 5, def: 8, spa: 5, spd: 5, spe: 8 };

  if (!Array.isArray(s.pokemons) || !s.pokemons.length) {
    const p = emptyPokemon();
    s.pokemons = [p];
    s.activePokemonId = p.id;
  }
  s.pokemons.forEach(p => {
    if (!p.id) p.id = uid();
    if (p.hpCurrent === undefined) p.hpCurrent = null;
    if (!p.points) p.points = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (p.heridas === undefined) p.heridas = 0;
    if (p.exp === undefined) p.exp = 0;
  });
  if (!s.combat) s.combat = { list: [], round: 1, currentIndex: 0 };
  if (!Array.isArray(s.combat.list)) s.combat.list = [];
  if (!s.items) s.items = { ball: 0, pot: 0, rev: 0, ant: 0 };

  return s;
}

let State = emptyState();

/**
 * Guarda el estado. Marca la edición como local y notifica a otras pestañas.
 * Antes de guardar, comprueba si hay una versión más reciente en localStorage
 * de otra pestaña que no sea la nuestra.
 */
function persist() {
  // Detección de conflicto: ¿otra pestaña guardó después que nosotros editamos?
  try {
    const diskRaw = localStorage.getItem(STORAGE_KEY);
    if (diskRaw && _lastLocalEdit) {
      const disk = JSON.parse(diskRaw);
      if (disk.updatedAt && disk.updatedAt > _lastLocalEdit + 500 && disk.updatedAt > State.updatedAt) {
        // Hay una versión más reciente en disco de otra pestaña.
        // Cargamos la más reciente y avisamos.
        console.warn('Detectada versión más reciente en otra pestaña. Recargando.');
        State = migrate(disk);
        State.updatedAt = Date.now();
        _lastLocalEdit = State.updatedAt;
        // Notificar al usuario
        if (window.App && App.notifyConflict) App.notifyConflict();
        return;
      }
    }
  } catch (e) { /* ignorar */ }

  State.updatedAt = Date.now();
  _lastLocalEdit = State.updatedAt;
  Storage.save(State);

  // Notificar a otras pestañas
  if (_bc) {
    try {
      _bc.postMessage({ type: 'state-updated', ts: State.updatedAt });
    } catch (e) { /* ignorar */ }
  }
}

/** Guardado sin comprobar conflictos (para uso interno tras cargar). */
function persistForce() {
  State.updatedAt = Date.now();
  _lastLocalEdit = State.updatedAt;
  Storage.save(State);
  if (_bc) {
    try { _bc.postMessage({ type: 'state-updated', ts: State.updatedAt }); } catch (e) {}
  }
}

function loadState() {
  const raw = Storage.load();
  State = migrate(raw || emptyState());
  _lastLocalEdit = State.updatedAt || 0;
}

function activePokemon() {
  return State.pokemons.find(p => p.id === State.activePokemonId) || State.pokemons[0];
}

/** Inicializa la sincronización entre pestañas. */
function initMultiTabSync() {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    _bc = new BroadcastChannel(STATE_CHANNEL);
    _bc.addEventListener('message', (ev) => {
      if (!ev.data || ev.data.type !== 'state-updated') return;
      if (ev.data.ts && ev.data.ts <= _lastLocalEdit) return;

      // Otra pestaña guardó algo nuevo. Recargamos del disco y avisamos.
      const raw = Storage.load();
      if (!raw) return;
      State = migrate(raw);
      _lastLocalEdit = State.updatedAt || 0;

      if (window.App && App.onExternalUpdate) App.onExternalUpdate();
    });
  } catch (e) {
    console.warn('BroadcastChannel no disponible:', e);
  }
}
