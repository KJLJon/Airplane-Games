/* =============================================================
   ui/shop.js — Upgrade shop UI
   ============================================================= */

function buildShop() {
  document.getElementById('shopCoins').textContent      = saveData.coins;
  document.getElementById('shopBlueprints').textContent = saveData.blueprints;

  const list = document.getElementById('upgradeList');
  list.innerHTML = '';
  let lastCat = '';

  UPGRADES.forEach(u => {
    if (u.cat !== lastCat) {
      lastCat = u.cat;
      const catEl = document.createElement('div');
      catEl.className = 'upg-category'; catEl.textContent = u.cat;
      list.appendChild(catEl);
    }

    const level   = getUpg(u.id);
    const maxed   = level >= u.maxLevel;
    const coinCost = maxed ? 0 : u.costCoins[level];
    const bpCost   = maxed ? 0 : (u.costBP[level] || 0);
    const canAfford = !maxed && saveData.coins >= coinCost && saveData.blueprints >= bpCost;

    const card = document.createElement('div');
    card.className = `upgrade-card${maxed ? ' maxed' : ''}`;

    const costLabel = maxed ? 'MAX' : `🪙${coinCost}${bpCost > 0 ? ` 📐${bpCost}` : ''}`;

    card.innerHTML = `
      <div class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-desc">${u.desc}</div>
        <div class="upg-level">Level ${level} / ${u.maxLevel}</div>
      </div>
      <button class="upg-buy" ${(!canAfford || maxed) ? 'disabled' : ''}>${costLabel}</button>`;

    if (canAfford && !maxed) {
      card.querySelector('.upg-buy').addEventListener('click', () => {
        saveData.coins      -= coinCost;
        saveData.blueprints -= bpCost;
        saveData.upgrades[u.id] = level + 1;
        persist();
        applyAllUpgrades();
        buildShop();
      });
    }
    list.appendChild(card);
  });
}
