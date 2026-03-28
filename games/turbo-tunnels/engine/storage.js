/* =============================================================
   engine/storage.js — Persistence layer (mirrors storage.js spec)
   All save data lives under localStorage key 'ag_turbo_tunnels'
   ============================================================= */

const Storage = {
  KEY: 'ag_turbo_tunnels',

  defaults() {
    return {
      bestDistance     : 0,
      coins            : 0,
      fuelCells        : 0,
      blueprints       : 0,
      unlockedVehicles : ['buggy'],
      selectedVehicle  : 'buggy',
      upgrades         : {},   // { upgradeId: level }
      settings         : { musicVol: 35, sfxVol: 70 },
    };
  },

  load() {
    try {
      return Object.assign(this.defaults(), JSON.parse(localStorage.getItem(this.KEY) || '{}'));
    } catch(_) { return this.defaults(); }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(_) {}
  },
};

// Global save data object — mutated in place, flushed via persist()
let saveData = Storage.load();
function persist() { Storage.save(saveData); }

// Upgrade level helper
function getUpg(id) { return saveData.upgrades[id] || 0; }
