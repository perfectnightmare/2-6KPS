// ads.js

module.exports = async function runAds(page) {
  const playersUrl = 'https://v3.g.ladypopular.com/ranking/players.php';

  console.log("🎯 Navigating to Players page...");
  await page.goto(playersUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Step 1: Click the Ads button forcibly
  console.log("📺 Clicking Ads button...");
  const adsBtn = await page.waitForSelector('button.btn-reklami-link.is-pulsating-glow', { timeout: 30000 });
  await adsBtn.click({ force: true });

  // Step 2: Wait for ad selection popup to appear
  console.log("⌛ Waiting for Ads popup...");
  await page.waitForTimeout(10000); // static wait before checking
  await page.waitForSelector('ul.ads-card-lists', { timeout: 20000 });

  // Step 3: Try to click an ad by priority
  const priorities = [
    'diamonds',
    'emeralds',
    'energy-orange',
    'dollars',
  ];

  let adClicked = false;

  for (const type of priorities) {
    const selector = `button[data-type="${type}"][data-ad-cooldown="0"]`;

    const adAvailable = await page.$(selector);
    if (adAvailable) {
      console.log(`✅ Clicking on "${type}" ad...`);
      await adAvailable.click({ force: true });
      adClicked = true;
      break;
    } else {
      console.log(`⏭️ "${type}" ad not available.`);
    }
  }

  if (!adClicked) {
    console.log("❌ No ads available from priority list. Aborting.");
    return;
  }

  // Step 4: Wait for ad player to appear
  console.log("▶️ Waiting for ad to start...");
  const adPlayerAppeared = await page.waitForSelector('#player', {
    timeout: 60000,
    state: 'attached' // Waits for it to exist, even if not yet visible
  }).catch(() => null);

  if (!adPlayerAppeared) {
    console.log("❌ Ad player never appeared. Skipping.");
    return;
  }

  // Step 5: Wait for ad to finish (player element disappears)
  console.log("⏳ Waiting for ad to finish...");
  await page.waitForSelector('#player', { state: 'detached', timeout: 180000 });

  // Step 6: Post-ad cooldown
  console.log("⏸️ Ad finished. Waiting 10 seconds...");
  await page.waitForTimeout(10000);

  console.log("🏁 1 Ad watched successfully.");
};
