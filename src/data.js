/* ============================================================
   data.js · Carga de catálogos
   Lee los JSON de /data al arrancar. Si falla uno, la app sigue.
   ============================================================ */
'use strict';

const Data = {
  pokedex: {},
  moves: {},
  abilities: {},
  classes: { categories: {}, classes: {} },
  items: {},
  glossary: {},
  loaded: false,

  async loadAll() {
    const files = [
      ['pokedex',   'data/pokedex.json'],
      ['moves',     'data/moves.json'],
      ['abilities', 'data/abilities.json'],
      ['classes',   'data/classes.json'],
      ['items',     'data/items.json'],
      ['glossary',  'data/glossary.json']
    ];

    for (const [key, path] of files) {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Normaliza según el formato de cada archivo
        if (key === 'moves')        this.moves     = json.movimientos || json;
        else if (key === 'classes') this.classes   = json;
        else if (key === 'glossary') this.glossary = json.terminos || json;
        else                        this[key]      = json;
      } catch (e) {
        console.warn(`No se pudo cargar ${path}:`, e.message);
      }
    }
    this.loaded = true;
  },

  /** Devuelve el objeto de un Pokémon por su clave (nombre inglés). */
  pokemon(key) { return this.pokedex[key] || null; },

  /** Lista de claves de Pokémon ordenadas alfabéticamente. */
  pokemonKeys() {
    return Object.keys(this.pokedex)
      .filter(k => !k.startsWith('_'))
      .sort();
  },

  /** Devuelve los datos de un movimiento, en español o inglés. */
  move(name) {
    if (!name) return null;
    if (this.moves[name]) return this.moves[name];
    // Buscar por alias en inglés
    for (const key in this.moves) {
      const m = this.moves[key];
      if (m && m.en && m.en.toLowerCase() === name.toLowerCase()) {
        return { ...m, _key: key };
      }
    }
    return null;
  }
};