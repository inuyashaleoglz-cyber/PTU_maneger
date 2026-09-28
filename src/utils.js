/* ============================================================
   utils.js · Utilidades compartidas
   Escapado de HTML, validación, sanitización, descarga de archivos.
   ============================================================ */
'use strict';

const Utils = {
  /** Escapa caracteres HTML para insertar texto en innerHTML con seguridad. */
  escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** Igual que escapeHtml pero para usar en atributos entre comillas dobles. */
  escapeAttr(s) {
    return this.escapeHtml(s);
  },

  /** Crea un elemento de texto seguro para reemplazar innerHTML. */
  textEl(tag, text, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = String(text ?? '');
    return el;
  },

  /** Normaliza texto para búsquedas: sin acentos, minúsculas, sin espacios exteriores. */
  norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  },

  /** Comprueba si un valor es un número entero válido dentro de un rango. */
  isIntInRange(v, min, max) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return false;
    if (!Number.isInteger(v)) return false;
    if (min !== undefined && v < min) return false;
    if (max !== undefined && v > max) return false;
    return true;
  },

  /** Comprueba si es string no vacío. */
  isStr(v) {
    return typeof v === 'string';
  },

  /** Comprueba si es array. */
  isArr(v) {
    return Array.isArray(v);
  },

  /** Comprueba si es objeto plano (no array, no null). */
  isObj(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  },

  /**
   * Valida un objeto de entrenador importado.
   * Devuelve { ok: true, data } o { ok: false, error }.
   */
  validateTrainer(t) {
    if (!this.isObj(t)) return { ok: false, error: 'El entrenador no es un objeto válido.' };

    const strings = ['name', 'concept', 'story', 'adept', 'novice', 'clase', 'training'];
    for (const k of strings) {
      if (t[k] !== undefined && !this.isStr(t[k])) {
        return { ok: false, error: `Campo "${k}" del entrenador debe ser texto.` };
      }
    }

    if (t.level !== undefined) {
      if (!this.isIntInRange(t.level, 1, 50)) {
        return { ok: false, error: 'El nivel del entrenador debe estar entre 1 y 50.' };
      }
    }

    if (t.weak !== undefined && !this.isArr(t.weak)) {
      return { ok: false, error: 'Las destrezas patéticas deben ser una lista.' };
    }
    if (this.isArr(t.weak) && t.weak.some(x => !this.isStr(x))) {
      return { ok: false, error: 'Cada destreza patética debe ser texto.' };
    }
    if (t.edges !== undefined && !this.isArr(t.edges)) {
      return { ok: false, error: 'Las ventajas deben ser una lista.' };
    }
    if (this.isArr(t.edges) && t.edges.some(x => !this.isStr(x))) {
      return { ok: false, error: 'Cada ventaja debe ser texto.' };
    }

    if (t.stats !== undefined) {
      if (!this.isObj(t.stats)) return { ok: false, error: 'Las estadísticas deben ser un objeto.' };
      for (const k of ['hp','atk','def','spa','spd','spe']) {
        if (t.stats[k] !== undefined && !this.isIntInRange(t.stats[k], 1, 99)) {
          return { ok: false, error: `Estadística "${k}" inválida.` };
        }
      }
    }

    return { ok: true };
  },

  /**
   * Valida un Pokémon importado.
   */
  validatePokemon(p) {
    if (!this.isObj(p)) return { ok: false, error: 'El Pokémon no es un objeto válido.' };

    if (p.species !== undefined && !this.isStr(p.species)) {
      return { ok: false, error: 'La especie debe ser texto.' };
    }
    if (p.nickname !== undefined && !this.isStr(p.nickname)) {
      return { ok: false, error: 'El apodo debe ser texto.' };
    }
    if (p.level !== undefined) {
      if (!this.isIntInRange(p.level, 1, 100)) {
        return { ok: false, error: 'El nivel del Pokémon debe estar entre 1 y 100.' };
      }
    }
    if (p.nature !== undefined) {
      if (!this.isIntInRange(p.nature, 0, 34)) {
        return { ok: false, error: 'La naturaleza debe ser un índice entre 0 y 34.' };
      }
    }
    if (p.points !== undefined) {
      if (!this.isObj(p.points)) return { ok: false, error: 'Los puntos deben ser un objeto.' };
      for (const k of ['hp','atk','def','spa','spd','spe']) {
        if (p.points[k] !== undefined && !this.isIntInRange(p.points[k], 0, 99)) {
          return { ok: false, error: `Punto "${k}" inválido.` };
        }
      }
    }
    if (p.ability !== undefined && !this.isStr(p.ability)) {
      return { ok: false, error: 'La habilidad debe ser texto.' };
    }
    if (p.moves !== undefined && !this.isStr(p.moves)) {
      return { ok: false, error: 'Los movimientos deben ser texto.' };
    }
    if (p.heridas !== undefined && !this.isIntInRange(p.heridas, 0, 20)) {
      return { ok: false, error: 'Las heridas deben ser un número entre 0 y 20.' };
    }
    if (p.exp !== undefined && !this.isIntInRange(p.exp, 0, 9999)) {
      return { ok: false, error: 'La EXP debe ser un número entre 0 y 9999.' };
    }

    return { ok: true };
  },

  /**
   * Valida el estado completo importado.
   * Devuelve { ok, error?, data } con el estado saneado si todo pasa.
   */
  validateImportedState(raw) {
    if (!this.isObj(raw)) return { ok: false, error: 'El código no contiene un objeto.' };
    if (!raw.t) return { ok: false, error: 'El código no contiene un entrenador.' };

    const vt = this.validateTrainer(raw.t);
    if (!vt.ok) return vt;

    const pokemons = raw.p || [];
    if (!this.isArr(pokemons)) {
      return { ok: false, error: 'Los Pokémon deben ser una lista.' };
    }
    if (pokemons.length > 60) {
      return { ok: false, error: 'Demasiados Pokémon en la ficha.' };
    }
    for (let i = 0; i < pokemons.length; i++) {
      const vp = this.validatePokemon(pokemons[i]);
      if (!vp.ok) return { ok: false, error: `Pokémon ${i + 1}: ${vp.error}` };
    }

    if (raw.items !== undefined && !this.isObj(raw.items)) {
      return { ok: false, error: 'El inventario debe ser un objeto.' };
    }

    const LIMIT = 5000;
    const cleanStr = s => this.isStr(s) ? s.slice(0, LIMIT) : '';

    const trainer = {
      name: cleanStr(raw.t.name),
      concept: cleanStr(raw.t.concept),
      story: cleanStr(raw.t.story),
      level: this.isIntInRange(raw.t.level, 1, 50) ? raw.t.level : 1,
      exp: this.isIntInRange(raw.t.exp, 0, 9999) ? raw.t.exp : 0,
      adept: this.isStr(raw.t.adept) ? raw.t.adept.slice(0, 100) : 'Educación Pokémon',
      novice: this.isStr(raw.t.novice) ? raw.t.novice.slice(0, 100) : 'Combate',
      weak: this.isArr(raw.t.weak) ? raw.t.weak.filter(this.isStr).slice(0, 10).map(s => s.slice(0, 100)) : [],
      edges: this.isArr(raw.t.edges) ? raw.t.edges.filter(this.isStr).slice(0, 20).map(s => s.slice(0, 100)) : [],
      clase: this.isStr(raw.t.clase) ? raw.t.clase.slice(0, 100) : '',
      training: this.isStr(raw.t.training) ? raw.t.training.slice(0, 100) : 'Entrenamiento de Agilidad',
      stats: { hp: 10, atk: 5, def: 5, spa: 5, spd: 5, spe: 5 }
    };
    if (this.isObj(raw.t.stats)) {
      for (const k of ['hp','atk','def','spa','spd','spe']) {
        if (this.isIntInRange(raw.t.stats[k], 1, 99)) trainer.stats[k] = raw.t.stats[k];
      }
    }

    const cleanPokemons = pokemons.map(p => ({
      id: this.uid(),
      species: this.isStr(p.species) ? p.species.slice(0, 60) : 'Bulbasaur',
      nickname: this.isStr(p.nickname) ? p.nickname.slice(0, 60) : '',
      level: this.isIntInRange(p.level, 1, 100) ? p.level : 5,
      nature: this.isIntInRange(p.nature, 0, 34) ? p.nature : 0,
      points: (() => {
        const out = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (this.isObj(p.points)) {
          for (const k of ['hp','atk','def','spa','spd','spe']) {
            if (this.isIntInRange(p.points[k], 0, 99)) out[k] = p.points[k];
          }
        }
        return out;
      })(),
      ability: this.isStr(p.ability) ? p.ability.slice(0, 100) : '',
      moves: this.isStr(p.moves) ? p.moves.slice(0, 1000) : '',
      hpCurrent: this.isIntInRange(p.hpCurrent, 0, 9999) ? p.hpCurrent : null,
      heridas: this.isIntInRange(p.heridas, 0, 20) ? p.heridas : 0,
      exp: this.isIntInRange(p.exp, 0, 9999) ? p.exp : 0,
      notes: this.isStr(p.notes) ? p.notes.slice(0, LIMIT) : '',
      tutorPoints: this.isIntInRange(p.tutorPoints, 0, 999) ? p.tutorPoints : 0
    }));

    const items = { ball: 0, pot: 0, rev: 0, ant: 0 };
    if (this.isObj(raw.items)) {
      for (const k of ['ball','pot','rev','ant']) {
        if (this.isIntInRange(raw.items[k], 0, 9999)) items[k] = raw.items[k];
      }
    }

    return { ok: true, data: { trainer, pokemons: cleanPokemons, items } };
  },

  /** Descarga un blob como archivo. */
  download(filename, content, mime = 'application/json') {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /** Copia texto al portapapeles con fallback. */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch (e2) {
        return false;
      }
    }
  },

  /** Genera un ID único. */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
};
