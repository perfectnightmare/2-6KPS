module.exports = async function scrapeProfileInfo(page) {
  try {
    console.log("🧭 Navigating to profile page...");
    await page.goto('https://v3.g.ladypopular.com/profile.php?id=7709322', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Click on the "About" button
    await page.waitForSelector('a.btn-round.btn-white.btn-s.active', { timeout: 15000 });
    await page.click('a.btn-round.btn-white.btn-s.active');
    await page.waitForTimeout(3000); // wait for content to appear

    // Extract Fashion Arena and Beauty Pageant info
    const fashionInfo = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.duel-stat')]
        .find(e => e.textContent.includes('Fashion Arena'));
      return el?.nextSibling?.textContent?.trim() || 'Not found';
    });

    const beautyInfo = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.duel-stat')]
        .find(e => e.textContent.includes('Beauty Pageant'));
      return el?.nextSibling?.textContent?.trim() || 'Not found';
    });

    // Extract stats
    const statNames = ['Elegance', 'Creativity', 'Kindness', 'Loyalty', 'Confidence', 'Grace'];
    const stats = {};

    for (const name of statNames) {
      try {
        const value = await page.$eval(
          `.profile-stat-right:has(span:text("${name}")) .stats-value`,
          el => el.textContent.trim()
        );
        stats[name] = value;
      } catch (e) {
        stats[name] = 'N/A';
      }
    }

    // Extract Emeralds
    let emeralds = 'N/A';
    try {
      emeralds = await page.$eval('#player-emeralds', el => el.textContent.trim());
    } catch (e) {
      console.log("⚠️ Could not extract emeralds.");
    }

    // Print results
    console.log("\n📄 PROFILE SUMMARY");
    console.log("🎽 Fashion Arena:", fashionInfo);
    console.log("💃 Beauty Pageant:", beautyInfo);

    console.log("\n📊 STATS");
    for (const [key, value] of Object.entries(stats)) {
      console.log(`${key}: ${value}`);
    }

    console.log(`\n💎 Emeralds: ${emeralds}`);

    // Go to ranking page
    console.log("\n📈 Navigating to ranking page...");
    await page.goto('https://v3.g.ladypopular.com/ranking/players.php', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('.ranking-self-stat', { timeout: 15000 });
    const ranking = await page.$eval('.ranking-self-stat', el => el.textContent.trim());

    console.log("🏆 Ranking:", ranking);
    console.log("✅ scrapeProfileInfo completed.\n");

  } catch (error) {
    console.log("❌ scrapeProfileInfo encountered an error:", error.message);
  }
};
