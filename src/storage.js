/* ============================================================
   storage.js · Persistencia con copia rotativa inteligente
   Solo rota la copia de seguridad cuando el estado realmente cambió.
   Añade aviso global de fallo y exportación de emergencia.
   ============================================================ */
'use strict';

const STORAGE_KEY = 'ptu-manager-v1';
const BACKUP_KEY  = 'ptu-manager-v1-backup';
const BACKUP_TS   = 'ptu-manager-v1-backup-ts';
const THEME_KEY   = 'ptu-theme';
const ONB_KEY     = 'ptu-onboarded';
const LAST_EXPORT  = 'ptu-last-export';

const Storage = {
  ok: true,
  lastError: null,

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

  /**
   * Guarda el estado. Solo rota la copia si el contenido cambió realmente.
   * Si falla, muestra aviso global y marca Storage.ok = false.
   */
  save(state) {
    try {
      const json = JSON.stringify(state);
      const prev = localStorage.getItem(STORAGE_KEY);

      // Solo rotar la copia si el contenido cambió
      if (prev && prev !== json) {
        localStorage.setItem(BACKUP_KEY, prev);
        localStorage.setItem(BACKUP_TS, String(Date.now()));
      }

      localStorage.setItem(STORAGE_KEY, json);
      this.ok = true;
      this.lastError = null;
      this._hideGlobalWarn();
    } catch (e) {
      this.ok = false;
      this.lastError = e;
      console.error('No se pudo guardar:', e);
      this._showGlobalWarn(e);
    }
  },

  /** Guarda una copia explícita antes de operaciones peligrosas (import, reset). */
  snapshotBeforeDangerous(reason) {
    try {
      const cur = localStorage.getItem(STORAGE_KEY);
      if (cur) {
        localStorage.setItem(BACKUP_KEY, cur);
        localStorage.setItem(BACKUP_TS, String(Date.now()));
      }
    } catch (e) {
      console.warn('No se pudo crear snapshot:', e);
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

  /** Devuelve la fecha de la última copia (ms) o null. */
  backupTimestamp() {
    const t = localStorage.getItem(BACKUP_TS);
    return t ? parseInt(t) : null;
  },

  hasBackup() {
    return !!localStorage.getItem(BACKUP_KEY);
  },

  /** Última exportación manual del usuario (ms o null). */
  getLastExport() {
    const t = localStorage.getItem(LAST_EXPORT);
    return t ? parseInt(t) : null;
  },

  markExported() {
    localStorage.setItem(LAST_EXPORT, String(Date.now()));
  },

  // ---------------- Preferencias de UI ----------------
  getTheme() { return localStorage.getItem(THEME_KEY) || 'dark'; },
  setTheme(t) { localStorage.setItem(THEME_KEY, t); },

  hasOnboarded() { return localStorage.getItem(ONB_KEY) === '1'; },
  setOnboarded() { localStorage.setItem(ONB_KEY, '1'); },

  // ---------------- Aviso global ----------------
  _showGlobalWarn(err) {
    const warn = document.getElementById('globalStorageWarn');
    const msg = document.getElementById('globalStorageWarnMsg');
    if (!warn || !msg) return;

    let extra = '';
    if (err && err.name === 'QuotaExceededError') {
      extra = 'El almacenamiento del navegador está lleno. Exporta tu ficha y borra datos antiguos.';
    } else if (err && err.name === 'SecurityError') {
      extra = 'El navegador bloquea el almacenamiento local (modo incógnito o configuración). Exporta tu ficha antes de cerrar.';
    } else {
      extra = 'No se pudieron guardar los cambios. Exporta tu ficha como copia de seguridad.';
    }
    msg.textContent = extra;
    warn.classList.remove('hide');
  },

  _hideGlobalWarn() {
    const warn = document.getElementById('globalStorageWarn');
    if (warn) warn.classList.add('hide');
  }
};
