module.exports = async function runBurnEnergy(page) {
  // 🟧 FASHION ARENA
  let arenaEnergy = 1;

  while (arenaEnergy > 0) {
    try {
      console.log("🟧 Navigating to BP...");
      await page.goto('https://v3.g.ladypopular.com/beauty_pageant.php', { timeout: 60000 });

      for (let i = 1; i <= 3; i++) {
        console.log(`🔄 Refreshing Fashion Arena page (${i}/2)...`);
        await page.reload({ timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
      }

      const energyText = await page.innerText(
        '#header > div.wrapper > div > div.player-panel-middle > div.player-panel-energy > a.player-energy.player-arena-energy > span.player-energy-value > span'
      );
      arenaEnergy = parseInt(energyText.trim());

      if (arenaEnergy <= 0 || isNaN(arenaEnergy)) {
        console.log("✅ No energy left. Skipping Fashion Arena.");
        break;
      }

      console.log(`🔋 You have ${arenaEnergy} energy. Starting duels...`);

      for (let i = 0; i < arenaEnergy; i++) {
        try {
          await page.evaluate(() => {
            return fetch('https://v3.g.ladypopular.com/ajax/arena.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: new URLSearchParams({ action: 'challenge' })
            });
          });
          console.log(`⚔️ Duel ${i + 1}`);
          await page.waitForTimeout(100);
        } catch (e) {
          console.log(`⚠️ Duel ${i + 1} failed: ${e.message}`);
          throw e;
        }
      }

      await page.reload({ timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      const energyAfter = await page.innerText(
        '#header > div.wrapper > div > div.player-panel-middle > div.player-panel-energy > a.player-energy.player-arena-energy > span.player-energy-value > span'
      );
      arenaEnergy = parseInt(energyAfter.trim());

      if (arenaEnergy > 0) {
        console.log(`🔁 Still ${arenaEnergy} energy left. Repeating duels.`);
      } else {
        console.log("✅ Finished all duels in Fashion Arena.");
        break;
      }

    } catch (err) {
      console.log("🔁 Error occurred. Refreshing page to retry Fashion Arena...");
      await page.reload({ timeout: 60000 });
      await page.waitForTimeout(5000);
    }
  }

  // 💅 BEAUTY PAGEANT
  async function getJudgeCycles() {
    const energySelector = '#header > div.wrapper > div > div.player-panel-middle > div.player-panel-energy > a.player-energy.player-bp-energy > span.player-energy-value';
    const blueEnergyText = await page.innerText(energySelector);
    const blueEnergy = parseInt(blueEnergyText.trim());
    const judgeCycles = Math.floor(blueEnergy / 2);
    return { blueEnergy, judgeCycles };
  }

  async function performJudgeCycle() {
    const duelRes = await page.evaluate(async () => {
      const res = await fetch('/ajax/beauty_pageant.php', {
        method: 'POST',
        body: new URLSearchParams({ action: 'judgeDuel' }),
        credentials: 'same-origin'
      });
      return await res.json();
    });

    const matches = [...duelRes.html.matchAll(/<a id="ladyIdContainer-(\d+)"/g)];
    const id1 = matches?.[0]?.[1];
    const id2 = matches?.[1]?.[1];
    if (!duelRes.duel_id || !id1 || !id2) {
      console.log('❌ Could not parse duel data. Skipping.');
      return;
    }

    const winner = Math.random() < 0.5 ? id1 : id2;

    // ✅ FIXED THIS PART:
    const voteRes = await page.evaluate(async ({ duelId, winnerId }) => {
      const res = await fetch('/ajax/beauty_pageant.php', {
        method: 'POST',
        body: new URLSearchParams({
          action: 'chooseWinner',
          duel_id: duelId,
          winner_id: winnerId
        }),
        credentials: 'same-origin'
      });
      return await res.json();
    }, { duelId: duelRes.duel_id, winnerId: winner });

    console.log(`👑 Judged duel ${duelRes.duel_id} | Winner: ${winner} | Response:`, voteRes);
  }

  console.log("🔷 Starting Beauty Pageant energy burn...");
  while (true) {
    await page.goto('https://v3.g.ladypopular.com/beauty_pageant.php', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    const { blueEnergy, judgeCycles } = await getJudgeCycles();
    console.log(`🔷 You have ${blueEnergy} blue energy. Judge cycles: ${judgeCycles}`);

    if (judgeCycles < 1) {
      console.log("✅ No judge cycles left. Skipping Beauty Pageant judging.");
      break;
    }

    for (let i = 0; i < judgeCycles; i++) {
      try {
        await performJudgeCycle();
        await page.waitForTimeout(3000);
      } catch (err) {
        console.log(`⚠️ Judge cycle ${i + 1} failed: ${err.message}`);
      }
    }
  }

  // 🎟️ Compete with Tickets
  console.log("🎟️ Checking ticket count to decide how many to use...");

  const getTicketCount = async () => {
    const ticketText = await page.innerText('.bp-pass-amount');
    return parseInt(ticketText.trim());
  };

  let tickets = await getTicketCount();
  console.log(`🎟️ You have ${tickets} tickets.`);

  let ticketsToUse = tickets - 90;

  if (ticketsToUse > 0) {
    console.log(`🎯 Using ${ticketsToUse} ticket(s)...`);
    while (ticketsToUse > 0) {
      try {
        console.log(`🧨 Using ticket ${tickets}... clicking compete button.`);
        await page.click('#competeInDuel', { timeout: 5000 });
        await page.waitForTimeout(6000);

        await page.goto('https://v3.g.ladypopular.com/beauty_pageant.php', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        await page.waitForTimeout(5000);

        tickets = await getTicketCount();
        ticketsToUse--;
        console.log(`🎟️ Tickets remaining: ${tickets}. Tickets left to use: ${ticketsToUse}`);
      } catch (e) {
        console.log(`⚠️ Error using ticket: ${e.message}`);
        await page.screenshot({ path: `bp-ticket-error-${tickets}.png`, fullPage: true });
        break;
      }
    }

    console.log("✅ Finished using excess tickets.");
  } else {
    console.log(`🚫 Tickets are ${tickets}. Not more than 90. Skipping.`);
  }
};
