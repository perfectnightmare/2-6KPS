module.exports = async function scrapeProfileInfo(page) {
  try {
    const profileUrl = process.env.PROFILE_URL;
    console.log("🧭 Navigating to profile page...");
    await page.goto(profileUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('a.btn-round.btn-white.btn-s.active', { timeout: 15000 });
    await page.click('a.btn-round.btn-white.btn-s.active');
    await page.waitForTimeout(3000);

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

    const statNames = ['Elegance', 'Creativity', 'Kindness', 'Loyalty', 'Confidence', 'Grace'];
    const stats = {};

    for (const name of statNames) {
      try {
        const value = await page.$eval(
          `.profile-stat-right:has(span:text("${name}")) .stats-value`,
          el => el.textContent.trim()
        );
        stats[name] = value;
      } catch {
        stats[name] = 'N/A';
      }
    }

    let emeralds = 'N/A';
    try {
      emeralds = await page.$eval('#player-emeralds', el => el.textContent.trim());
    } catch {
      console.log("⚠️ Could not extract emeralds.");
    }

    console.log("\n📄 PROFILE SUMMARY");
    console.log("🎽 Fashion Arena:", fashionInfo);
    console.log("💃 Beauty Pageant:", beautyInfo);

    console.log("\n📊 STATS");
    for (const [key, value] of Object.entries(stats)) {
      console.log(`${key}: ${value}`);
    }

    console.log(`\n💎 Emeralds: ${emeralds}`);

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
