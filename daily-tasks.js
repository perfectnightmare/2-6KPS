/**
 * daily-tasks.js
 * Collects Type 1 (7 daily tasks) and Type 2 (3 daily chests)
 * Fully Playwright-compatible
 */

module.exports = async function runDailyTasks(page) {
  console.log("📋 Daily Tasks Automation — Type 1 & Type 2");

  // ----------------------------
  // PHASE 1: Fetch Daily Tasks popup
  // ----------------------------
  let popupData;
  try {
    console.log("🌐 Fetching Daily Tasks popup...");
    popupData = await page.evaluate(async () => {
      const res = await fetch(
        "/ajax/battlepass/quests.php?type=getDailyQuestsPopup&page=players_ranking",
        {
          method: "GET",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json, text/javascript, */*; q=0.01"
          },
          credentials: "same-origin"
        }
      );
      return await res.json();
    });

    console.log("✅ Daily Tasks popup fetched successfully");
  } catch (err) {
    console.error("❌ Failed to fetch Daily Tasks popup:", err);
    return;
  }

  // ----------------------------
  // PHASE 1A: Extract Type 1 tasks
  // ----------------------------
  const type1Tasks = await page.evaluate((popup) => {
    return popup.quests
      .filter(q => q.status === "4") // completed but not claimed
      .map(q => ({
        quest_id: q.id,
        status: q.status,
        battlepass_keys: q.reward?.battlepass_keys || 0,
        title: q.title
      }));
  }, popupData);

  console.log("✅ Type 1 claimable tasks:", type1Tasks);

  // ----------------------------
  // PHASE 1B: Extract Type 2 chests
  // ----------------------------
  const type2Chests = await page.evaluate(() => {
    const chests = [...document.querySelectorAll('.daily-chest.semi-opened')];
    return chests.map(chest => {
      const index = Number(chest.dataset.chestIndex);
      return {
        quest_id: chest.dataset.quest,
        chest_index: index,
        chest_id: index + 1, // backend expects 1,2,3
        required_keys: Number(chest.dataset.requiredKeys)
      };
    });
  });

  console.log("✅ Type 2 claimable chests:", type2Chests);

  // ----------------------------
  // PHASE 2A: Claim Type 1 tasks
  // ----------------------------
  for (const task of type1Tasks) {
    try {
      const result = await page.evaluate(async ({ quest_id }) => {
        const res = await fetch("/ajax/battlepass/quests.php", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          credentials: "same-origin",
          body: new URLSearchParams({
            type: "giveDailyQuestReward",
            quest_id,
            chest_id: -1 // constant for Type 1 tasks
          })
        });
        return await res.json();
      }, { quest_id: task.quest_id });

      console.log(`✅ Claimed Type 1 task ${task.quest_id}`, result);
      await page.waitForTimeout(1000);
    } catch (err) {
      console.error(`❌ Failed claiming Type 1 task ${task.quest_id}`, err);
    }
  }

  // ----------------------------
  // PHASE 2B: Claim Type 2 chests
  // ----------------------------
  for (const chest of type2Chests) {
    try {
      const result = await page.evaluate(async ({ quest_id, chest_id }) => {
        const res = await fetch("/ajax/battlepass/quests.php", {
          method: "POST",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
          },
          credentials: "same-origin",
          body: new URLSearchParams({
            type: "giveDailyQuestReward",
            quest_id,
            chest_id
          })
        });
        return await res.json();
      }, { quest_id: chest.quest_id, chest_id: chest.chest_id });

      console.log(`🎉 Claimed Type 2 chest ${chest.chest_id} (quest_id ${chest.quest_id})`, result);
      await page.waitForTimeout(1200);
    } catch (err) {
      console.error(`❌ Failed claiming Type 2 chest ${chest.chest_id} (quest_id ${chest.quest_id})`, err);
    }
  }

  console.log("🏁 Daily Tasks Automation Complete — Type 1 & Type 2");
};
