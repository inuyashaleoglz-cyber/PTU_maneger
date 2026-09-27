/* ============================================================
   tools.js · Calculadoras + dados
   ============================================================ */
'use strict';

const Tools = {
  DAMAGE_TABLE: {
    1:['1d6+1',5], 2:['1d6+3',7], 3:['1d6+5',9], 4:['1d8+6',11],
    5:['1d8+8',13], 6:['2d6+8',15], 7:['2d6+10',17], 8:['2d8+10',19],
    9:['2d10+10',21], 10:['3d8+10',24], 11:['3d10+10',27], 12:['3d12+10',30],
    13:['4d10+10',35], 14:['4d10+15',40], 15:['4d10+20',45], 16:['5d10+20',50],
    17:['5d12+25',60], 18:['6d12+25',65], 19:['6d12+30',70], 20:['6d12+35',75],
    21:['6d12+40',80], 22:['6d12+45',85], 23:['6d12+50',90], 24:['6d12+55',95],
    25:['6d12+60',100], 26:['7d12+65',110], 27:['8d12+70',120], 28:['8d12+80',130]
  },

  init() {
    ['d-db','d-stat','d-def','d-mult'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calcDamage());
    });
    ['c-niv','c-ball','c-pg','c-otr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calcCapture());
    });
    this.calcDamage();
    this.calcCapture();
    this._fillDmgTable();

    // Dados
    document.querySelectorAll('.die').forEach(die => {
      die.addEventListener('click', () => this.rollDie(die));
    });
    document.getElementById('clearRolls').addEventListener('click', () => {
      document.getElementById('rollLog').innerHTML = '<div style="color:var(--dim)">Sin tiradas todavía.</div>';
    });
  },

  calcDamage() {
    const db = Math.max(1, Math.min(28, parseInt(document.getElementById('d-db').value) || 1));
    const st = parseInt(document.getElementById('d-stat').value) || 0;
    const df = parseInt(document.getElementById('d-def').value) || 0;
    const mu = parseFloat(document.getElementById('d-mult').value);
    const row = this.DAMAGE_TABLE[db];
    const base = row[1] + st - df;
    const total = Math.max(0, Math.floor(base * mu));
    document.getElementById('d-out').textContent = total;
    document.getElementById('d-f').textContent =
      `${row[0]} (= ${row[1]}) + ${st} − ${df} = ${base}  →  ×${mu} = ${total}`;
  },

  calcCapture() {
    const n = parseInt(document.getElementById('c-niv').value) || 0;
    const b = parseInt(document.getElementById('c-ball').value) || 0;
    const p = parseInt(document.getElementById('c-pg').value) || 0;
    const o = parseInt(document.getElementById('c-otr').value) || 0;
    const rate = Math.max(0, Math.min(100, 100 - n * 2 + b + p + o));
    document.getElementById('c-out').textContent = rate;
  },

  _fillDmgTable() {
    const tb = document.getElementById('dmgTable');
    if (!tb) return;
    const rows = [];
    for (let i = 1; i <= 14; i++) {
      const a = this.DAMAGE_TABLE[i], b = this.DAMAGE_TABLE[i + 14];
      rows.push(`<tr>
        <th class="num">${i}</th><td>${a[0]}</td><td class="num">${a[1]}</td>
        <th class="num">${i + 14}</th><td>${b[0]}</td><td class="num">${b[1]}</td>
      </tr>`);
    }
    tb.innerHTML = rows.join('');
  },

  /** Registro de tiradas. */
  log(text, cls = '') {
    const log = document.getElementById('rollLog');
    if (!log) return;
    if (log.querySelector('div[style*="dim"]')) log.innerHTML = '';
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = cls;
    div.textContent = `[${time}] ${text}`;
    log.prepend(div);
    while (log.children.length > 40) log.lastChild.remove();
  },

  rollDie(dieEl) {
    const spec = dieEl.dataset.d;
    const mod = parseInt(document.getElementById('mod').value) || 0;
    const m = spec.match(/^(\d+)d(\d+)$/);
    if (!m) return;
    const n = parseInt(m[1]), faces = parseInt(m[2]);
    const rolls = [];
    for (let i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * faces));
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + mod;

    dieEl.querySelector('span').textContent = total;
    dieEl.classList.remove('roll'); void dieEl.offsetWidth; dieEl.classList.add('roll');

    let cls = '';
    if (n === 1 && faces === 20) {
      if (rolls[0] === 20) cls = 'crit';
      if (rolls[0] === 1) cls = 'fail';
    }
    const detail = n === 1
      ? `${spec} → ${sum}`
      : `${spec} → [${rolls.join(', ')}] = ${sum}`;
    this.log(`${detail}${mod ? ` ${mod > 0 ? '+' : ''}${mod} = ${total}` : ''}`, cls);
  },

  /** Tira una destreza y actualiza el botón. */
  rollSkill(skill, btn) {
    const rank = Trainer.rankOf(skill);
    const rolls = [];
    for (let i = 0; i < rank; i++) rolls.push(1 + Math.floor(Math.random() * 6));
    const total = rolls.reduce((a, b) => a + b, 0);
    this.log(`${skill}: ${rank}d6 → [${rolls.join(', ')}] = ${total}`);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = total;
      btn.classList.remove('ghost');
      setTimeout(() => { btn.textContent = orig; btn.classList.add('ghost'); }, 1400);
    }
    return total;
  },

  renderSkillRolls() {
    const el = document.getElementById('skillRollsBlock');
    if (!el) return;
    el.innerHTML = `<div class="tw" style="padding:4px 0">${Wizard.SKILLS.map(s => {
      const r = Trainer.rankOf(s);
      const cls = r === 1 ? 'r' : r >= 4 ? 'g' : '';
      const rankName = { 1:'Patético', 2:'Sin entrenar', 3:'Novato', 4:'Adepto', 5:'Experto', 6:'Maestro' }[r];
      return `<div class="skill-roll">
        <div class="skname">${s} <span class="tag ${cls}">${rankName}</span></div>
        <div class="skdice">${r}d6</div>
        <button class="btn ghost xs" data-roll="${s}">Tirar</button>
      </div>`;
    }).join('')}</div>`;
    el.querySelectorAll('[data-roll]').forEach(b =>
      b.addEventListener('click', () => this.rollSkill(b.dataset.roll, b)));
  }
};