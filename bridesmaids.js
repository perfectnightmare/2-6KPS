module.exports = async function runBridesmaids(page) {
  // =========================
  // 🔧 CONFIG
  // =========================
  const PARTY_ID = 2816; // ⬅️ update manually when party changes
  const BASE_URL = 'https://v3.g.ladypopular.com/party/center/planning.php';

  const TARGET_URL = `${BASE_URL}?bridesmaid_party_id=${PARTY_ID}`;

  console.log(`👰 Bridesmaids script started (Party ID: ${PARTY_ID})`);

  // =========================
  // 🌐 LOAD PAGE
  // =========================
  await page.goto(TARGET_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(5000);

  // =========================
  // 🔍 DETERMINE ACTIVE TASK
  // =========================
  const inactiveCount = await page.$$eval(
    '.party-center-menu-item.inactive',
    els => els.length
  );

  console.log(`🔍 Inactive task count: ${inactiveCount}`);

  // Mapping:
  // 3 inactive → Task 1 active
  // 2 inactive → Task 2 active
  // 1 or 0 inactive → skip everything

  if (inactiveCount >= 1 && inactiveCount <= 0) {
    console.log('⏭️ No relevant bridesmaid tasks active. Skipping.');
    return;
  }

  // =========================
  // 🌸 TASK 1 — BOUQUETS
  // =========================
  if (inactiveCount === 3) {
    console.log('🌸 Task 1 active: Collect Bouquet');

    const bouquetIds = await page.$$eval('.gb_bouquet', els =>
      els.map(el => el.getAttribute('rel')).filter(Boolean)
    );

    if (bouquetIds.length === 0) {
      console.log('✅ No bouquets available to collect.');
      return;
    }

    const bouquetId = bouquetIds[0];
    console.log(`🌼 Attempting bouquet ID: ${bouquetId}`);

    const response = await page.evaluate(async ({ partyId, bouquetId }) => {
      const res = await fetch(
        'https://v3.g.ladypopular.com/ajax/party/planning/bridesmaids.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: new URLSearchParams({
            party_id: partyId,
            action: 'getBouquet',
            bouquet_id: bouquetId,
          }),
          credentials: 'same-origin',
        }
      );
      return res.json();
    }, { partyId: PARTY_ID, bouquetId });

    if (response.status === 1) {
      console.log(`✅ Bouquet ${bouquetId} collected successfully.`);
    } else {
      console.log(`⏳ Bouquet cooldown active: ${response.message || 'Cooldown'}`);
    }

    return; // Task 1 ends after one attempt
  }

  // =========================
  // 🎁 TASK 2 — SOUVENIRS
  // =========================
  if (inactiveCount === 2) {
    console.log('🎁 Task 2 active: Souvenirs');

    const hasStartButton = await page.$(
      'button[onclick="startMakingSouvenir()"]'
    );
    const hasFinishButton = await page.$(
      'button[onclick="tryMakingSouvenir()"]'
    );
    const hasProgressBar = await page.$('.progressbar-wrap');

    // -------- STATE 2: COOLDOWN --------
    if (hasProgressBar && !hasFinishButton) {
      console.log('⏳ Souvenir cooldown active. Skipping.');
      return;
    }

    // -------- STATE 1: START MAKING --------
    if (hasStartButton && !hasFinishButton) {
      console.log('▶️ Starting souvenir...');

      const res = await page.evaluate(async partyId => {
        const r = await fetch(
          'https://v3.g.ladypopular.com/ajax/party/planning/bridesmaids.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({
              party_id: partyId,
              action: 'startMakingSouvenir',
            }),
            credentials: 'same-origin',
          }
        );
        return r.json();
      }, PARTY_ID);

      if (res.status === 1) {
        console.log('✅ Souvenir started successfully.');
      } else {
        console.log('⚠️ Failed to start souvenir.', res);
      }

      return;
    }

    // -------- STATE 3: FINISH & RESTART --------
    if (hasFinishButton) {
      console.log('🏁 Finishing souvenir...');

      const finishRes = await page.evaluate(async partyId => {
        const r = await fetch(
          'https://v3.g.ladypopular.com/ajax/party/planning/bridesmaids.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({
              party_id: partyId,
              action: 'tryMakingSouvenir',
            }),
            credentials: 'same-origin',
          }
        );
        return r.json();
      }, PARTY_ID);

      console.log(
        finishRes.status === 1
          ? '🎉 Souvenir completed.'
          : '⚠️ Souvenir may be ruined, continuing anyway.'
      );

      console.log('🔄 Starting new souvenir...');

      const startRes = await page.evaluate(async partyId => {
        const r = await fetch(
          'https://v3.g.ladypopular.com/ajax/party/planning/bridesmaids.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: new URLSearchParams({
              party_id: partyId,
              action: 'startMakingSouvenir',
            }),
            credentials: 'same-origin',
          }
        );
        return r.json();
      }, PARTY_ID);

      if (startRes.status === 1) {
        console.log('✅ New souvenir started.');
      } else {
        console.log('⚠️ Failed to start new souvenir.', startRes);
      }

      return;
    }

    console.log('❓ Unknown souvenir state. Skipping.');
  }
};
