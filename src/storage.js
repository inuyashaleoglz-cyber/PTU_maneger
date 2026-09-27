/* ============================================================
   storage.js · Persistencia
   Hoy: localStorage. Mañana: API. El resto del código no se entera.
   ============================================================ */
'use strict';

const STORAGE_KEY = 'ptu-manager-v1';
const BACKUP_KEY  = 'ptu-manager-v1-backup';
const THEME_KEY   = 'ptu-theme';
const ONB_KEY     = 'ptu-onboarded';

const Storage = {
  ok: true,

  /** Lee el estado principal. Devuelve null si no hay nada. */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Estado corrupto, empezando limpio.', e);
      return null;
    }
  },

  /** Guarda el estado. Antes, copia el anterior a backup. */
  save(state) {
    try {
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      this.ok = true;
    } catch (e) {
      this.ok = false;
      const w = document.getElementById('warnStorage');
      if (w) w.classList.remove('hide');
      console.error('No se pudo guardar:', e);
    }
  },

  /** Restaura la última copia de seguridad. */
  restoreBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /** Preferencias de UI (no forman parte de la ficha). */
  getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; },
  setTheme(t) { localStorage.setItem(THEME_KEY, t); },

  hasOnboarded() { return localStorage.getItem(ONB_KEY) === '1'; },
  setOnboarded() { localStorage.setItem(ONB_KEY, '1'); }
};