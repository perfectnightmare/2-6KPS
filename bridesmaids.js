module.exports = async function runBridesmaidsTasks(page) {
  // ============================
  // 🔧 MANUAL CONFIG
  // ============================
  const PARTY_ID = 2816; // <-- update manually when party changes
  const TASK_1_URL = `https://v3.g.ladypopular.com/party/center/planning.php?bridesmaid_party_id=${PARTY_ID}`;

  console.log("👰 Starting Bridesmaids Tasks...");

  // ============================
  // 🧩 TASK 1 – COLLECT BOUQUET
  // ============================
  console.log("💐 Task 1: Checking pending bouquets...");

  try {
    await page.goto(TASK_1_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    // Collect all visible (pending) bouquet IDs
    const bouquetIds = await page.$$eval('.gb_bouquet', els =>
      els
        .map(el => el.getAttribute('rel'))
        .filter(Boolean)
        .map(id => parseInt(id))
    );

    const pendingCount = bouquetIds.length;

    console.log(`💐 Pending bouquets found: ${pendingCount}`);

    // 🚫 Skip conditions
    if (pendingCount === 0 || pendingCount === 100) {
      console.log("✅ Task 1 already completed. Skipping to Task 2...");
    } else {
      const bouquetIdToCollect = bouquetIds[0]; // pick ONE bouquet only

      console.log(`🌸 Attempting to collect bouquet ID: ${bouquetIdToCollect}`);

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

        return await res.json();
      }, { partyId: PARTY_ID, bouquetId: bouquetIdToCollect });

      if (response.status === 1) {
        console.log(
          `✅ Bouquet ${response.bouquet} collected successfully. Progress: ${response.progress}/${response.total}`
        );
      } else {
        console.log("⏳ Bouquet cooldown active.");
        if (response.message) {
          console.log(`ℹ️ Message: ${response.message.replace(/<br\s*\/?>/gi, ' ')}`);
        }
      }
    }
  } catch (err) {
    console.log(`❌ Task 1 failed: ${err.message}`);
    await page.screenshot({ path: 'bridesmaids-task1-error.png', fullPage: true });
  }

  // ============================
  // 🧩 TASK 2 – (PLACEHOLDER)
  // ============================
  console.log("🧩 Task 2: Placeholder (to be implemented later).");

  console.log("👰 Bridesmaids tasks finished.");
};
