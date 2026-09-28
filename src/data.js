/* ============================================================
   data.js · Carga de catálogos
   Lee los JSON de /data al arrancar. Reporta qué falló.
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
  loadStatus: { loaded: [], failed: [], total: 0 },

  async loadAll() {
    const files = [
      ['pokedex',   'data/pokedex.json'],
      ['moves',     'data/moves.json'],
      ['abilities', 'data/abilities.json'],
      ['classes',   'data/classes.json'],
      ['items',     'data/items.json'],
      ['glossary',  'data/glossary.json']
    ];
    this.loadStatus = { loaded: [], failed: [], total: files.length };

    for (const [key, path] of files) {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (key === 'moves')        this.moves     = json.movimientos || json;
        else if (key === 'classes') this.classes   = json;
        else if (key === 'glossary') this.glossary = json.terminos || json;
        else                        this[key]      = json;

        this.loadStatus.loaded.push(key);
      } catch (e) {
        console.warn(`No se pudo cargar ${path}:`, e.message);
        this.loadStatus.failed.push({ key, path, error: e.message });
      }
    }
    this.loaded = true;
  },

  pokemon(key) { return this.pokedex[key] || null; },

  pokemonKeys() {
    return Object.keys(this.pokedex)
      .filter(k => !k.startsWith('_'))
      .sort();
  },

  move(name) {
    if (!name) return null;
    if (this.moves[name]) return this.moves[name];
    for (const key in this.moves) {
      const m = this.moves[key];
      if (m && m.en && m.en.toLowerCase() === name.toLowerCase()) {
        return { ...m, _key: key };
      }
    }
    return null;
  }
};
