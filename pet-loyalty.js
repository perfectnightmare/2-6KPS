module.exports = async function runPetLoyalty(page) {
  console.log("🐾 Starting Pet Loyalty Training...");

  try {
    // STEP 1: Go to pets page
    await page.goto('https://v3.g.ladypopular.com/pets.php', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // STEP 2.1: Check cooldown
    const cooldownData = await page.evaluate(() => {
      const cooldownEl = document.querySelector('#trainingCooldown');
      const trainBtn = document.querySelector('#trainPet');

      if (!cooldownEl || !trainBtn) return null;

      const width = cooldownEl.style.width || '0%';
      const percent = parseInt(width.replace('%', '').trim()) || 0;
      const onclick = trainBtn.getAttribute('onclick') || '';
      const buttonText = trainBtn.innerText || '';

      return { percent, onclick, buttonText };
    });

    if (!cooldownData) {
      console.log("⚠️ Could not read pet training elements. Skipping.");
      return;
    }

    // Cooldown active → skip entirely
    if (
      cooldownData.percent > 0 ||
      cooldownData.onclick.includes('removeTrainingCooldown') ||
      cooldownData.buttonText.includes('Finish immediately')
    ) {
      console.log("⏳ Pet training cooldown active. Skipping to avoid diamond spend.");
      return;
    }

    console.log("✅ No cooldown detected.");

    // STEP 2.2: Extract training cost
    const trainingCost = await page.evaluate(() => {
      const btn = document.querySelector('#trainPet');
      return btn ? parseInt(btn.getAttribute('data-price')) : null;
    });

    if (!trainingCost || isNaN(trainingCost)) {
      console.log("⚠️ Could not determine training cost. Skipping.");
      return;
    }

    // STEP 2.3: Extract player dollars
    const playerDollars = await page.evaluate(() => {
      const el = document.querySelector('#player-dollars');
      if (!el) return 0;
      return parseInt(el.innerText.replace(/,/g, '').trim());
    });

    console.log(`💰 Player dollars: ${playerDollars}`);
    console.log(`🐾 Training cost: ${trainingCost}`);

    if (playerDollars <= trainingCost) {
      console.log("🚫 Not enough dollars to train pet. Skipping.");
      return;
    }

    // STEP 2.4: Extract pet ID
    const petId = await page.evaluate(() => {
      const btn = document.querySelector('#trainPet');
      if (!btn) return null;
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/trainLoyalty\((\d+)\)/);
      return match ? parseInt(match[1]) : null;
    });

    if (!petId) {
      console.log("⚠️ Could not extract pet ID. Skipping.");
      return;
    }

    console.log(`🐕 Pet ID detected: ${petId}`);

    // STEP 3: Send internal request (NO CLICK)
    const response = await page.evaluate(async (petId) => {
      const res = await fetch('/ajax/pets.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
          type: 'trainLoyalty',
          pet_id: petId
        }),
        credentials: 'same-origin'
      });

      return await res.json();
    }, petId);

    // RESULT
    if (response && response.status === 1) {
      console.log("🎉 Pet loyalty trained successfully!");
      console.log(`📈 New Loyalty: ${response.info?.newTotalLoyalty}`);
    } else {
      console.log("❌ Pet loyalty training failed.");
      console.log(response);
    }

  } catch (err) {
    console.log(`❌ Pet Loyalty script error: ${err.message}`);
    await page.screenshot({ path: 'pet-loyalty-error.png', fullPage: true });
  }
};
