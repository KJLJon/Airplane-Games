/* =============================================================
   ui/vehicleSelect.js — Vehicle selection screen
   ============================================================= */

function buildVehicleGrid() {
  const grid  = document.getElementById('vehicleGrid');
  const label = document.getElementById('vehicleSelectedLabel');
  grid.innerHTML = '';

  label.textContent = 'Selected: ' + getSelectedVehicle().name;

  VEHICLES.forEach(v => {
    const owned    = saveData.unlockedVehicles.includes(v.id);
    const selected = saveData.selectedVehicle === v.id;

    const card = document.createElement('div');
    card.className = `vehicle-card${selected ? ' selected' : ''}${!owned ? ' locked' : ''}`;

    const statBar = (val) => '▮'.repeat(val) + '▯'.repeat(5 - val);
    const { speed, grip, suspension, fuel, cooling } = v.stats;

    card.innerHTML = `
      <div class="vehicle-icon">${v.icon}</div>
      <div class="vehicle-name">${v.name}</div>
      <div class="vehicle-stats">
        SPD ${statBar(speed)}<br>
        GRP ${statBar(grip)}<br>
        FUEL ${statBar(fuel)}
      </div>
      ${!owned ? `<div class="vehicle-unlock">🪙${v.unlockCost} / 📐${v.unlockBP}</div>` : ''}
      ${selected ? '<div style="color:#ffab00;font-size:0.72rem;margin-top:3px">✓ Active</div>' : ''}`;

    if (owned) {
      card.addEventListener('click', () => {
        saveData.selectedVehicle = v.id;
        persist();
        buildVehicleGrid();
      });
    } else {
      // Unlock button if affordable
      if (saveData.coins >= v.unlockCost && saveData.blueprints >= v.unlockBP) {
        card.classList.remove('locked');
        card.style.borderColor = '#ffab00';
        const unlockBtn = document.createElement('button');
        unlockBtn.style.cssText = 'margin-top:6px;padding:5px 10px;background:linear-gradient(135deg,#ffd740,#ff6d00);color:#000;border:none;border-radius:8px;font-size:0.75rem;font-weight:800;cursor:pointer;';
        unlockBtn.textContent = 'Unlock';
        unlockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          saveData.coins      -= v.unlockCost;
          saveData.blueprints -= v.unlockBP;
          saveData.unlockedVehicles.push(v.id);
          persist();
          buildVehicleGrid();
        });
        card.appendChild(unlockBtn);
      }
    }
    grid.appendChild(card);
  });
}
