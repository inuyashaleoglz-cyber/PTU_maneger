/* ============================================================
   state.js · Estado global
   Un único objeto `State` con todo. Se guarda con Storage.save().
   ============================================================ */
'use strict';

const SCHEMA_VERSION = 3;

/** Estado vacío con valores por defecto sensatos. */
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

/** ID único corto. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Migración entre versiones de esquema. */
function migrate(s) {
  if (!s || typeof s !== 'object') return emptyState();

  // v1 → v2: pokemon único pasa a array
  if (!s.version || s.version < 2) {
    if (s.pokemon && !s.pokemons) {
      const p = Object.assign(emptyPokemon(), s.pokemon, { id: uid() });
      s.pokemons = [p];
      s.activePokemonId = p.id;
      delete s.pokemon;
    }
    s.version = 2;
  }

  // v2 → v3: features separadas, exp del entrenador, dmSheets
  if (s.version < 3) {
    if (!s.trainer.exp) s.trainer.exp = 0;
    if (!Array.isArray(s.dmSheets)) s.dmSheets = [];
    s.version = 3;
  }

  // Normaliza el valor de entrenamiento si venía del formato antiguo
  if (s.trainer && s.trainer.training) {
    const map = {
      agilidad: 'Entrenamiento de Agilidad',
      enfocado: 'Entrenamiento Enfocado',
      brutal: 'Entrenamiento Brutal',
      inspirador: 'Entrenamiento Inspirador'
    };
    if (map[s.trainer.training]) s.trainer.training = map[s.trainer.training];
  }

  // Saneamiento general
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

  return s;
}

let State = emptyState();

/** Guarda el estado actual. Llamar tras cualquier cambio importante. */
function persist() {
  State.updatedAt = Date.now();
  Storage.save(State);
}

/** Carga el estado desde disco (o crea uno nuevo). */
function loadState() {
  const raw = Storage.load();
  State = migrate(raw || emptyState());
}

/** Pokémon actualmente seleccionado en la UI. */
function activePokemon() {
  return State.pokemons.find(p => p.id === State.activePokemonId) || State.pokemons[0];
}