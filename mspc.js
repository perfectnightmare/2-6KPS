require('dotenv').config();
const { chromium } = require('playwright');
const readline = require('readline');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.LP_EMAIL;
  const password = process.env.LP_PASSWORD;

  console.log(`🔐 Opening Lady Popular login page...`);
  await page.goto('https://ladypopular.com', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  console.log("🔎 Waiting for Sign In button...");
  await page.waitForSelector('#login-btn', { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.click('#login-btn');

  console.log("🔐 Entering credentials...");
  await page.waitForSelector('#login-username-field', { timeout: 10000 });
  await page.fill('#login-username-field', email);
  await page.fill('#loginForm3 > div > label:nth-child(2) > input[type=password]', password);
  await page.waitForTimeout(3000);
  await page.click('#loginSubmit');

  await page.waitForSelector('#header', { timeout: 15000 });
  console.log("🎉 Login successful.");

  // Wait 30 seconds for everything to load
  console.log("⏳ Waiting 30 seconds after login...");
  await page.waitForTimeout(30000);

  // Simulate the exact JS command
  console.log("🍪 Clicking #save-and-exit via JS...");
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('#save-and-exit');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    console.log("✅ Cookie popup dismissed via JS.");
  } else {
    console.log("❌ #save-and-exit not found.");
    await page.screenshot({ path: 'cookie-error.png', fullPage: true });
  }

  // ⏸️ Wait for user to press Enter
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise(resolve => {
    rl.question('\n📴 Press Enter to close browser and end script...', () => {
      rl.close();
      resolve();
    });
  });

  await page.screenshot({ path: 'final-screen.png', fullPage: true });
  await browser.close();
  console.log("✅ Browser closed. Script done.");
})();
