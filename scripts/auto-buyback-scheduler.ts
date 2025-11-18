import { checkAndExecuteAutoBuyback } from "../lib/treasury-manager"
import * as cron from "node-cron"

/**
 * Auto Buyback Scheduler
 * Runs every hour to check if buyback should be executed
 * Can be deployed as a separate serverless function or cron job
 */

async function scheduleBuyback() {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Buyback Scheduler] Checking for auto-buyback opportunity...")
      const executed = await checkAndExecuteAutoBuyback()

      if (executed) {
        console.log("[Buyback Scheduler] Auto-buyback executed successfully")
      } else {
        console.log("[Buyback Scheduler] Buyback conditions not met, waiting...")
      }
    } catch (error) {
      console.error("[Buyback Scheduler] Error:", error)
    }
  })

  console.log("[Buyback Scheduler] Initialized - will check hourly for buyback opportunities")
}

scheduleBuyback()
