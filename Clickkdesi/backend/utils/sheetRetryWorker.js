import cron from "node-cron";
import {
  DEFAULT_PENDING_SHEET_BATCH_SIZE,
  syncPendingSheetOrders,
} from "./sheetSync.js";

const SHEET_RETRY_ENABLED = process.env.SHEET_RETRY_ENABLED !== "false";
const SHEET_RETRY_SCHEDULE = process.env.SHEET_RETRY_SCHEDULE || "*/15 * * * *";
const SHEET_RETRY_BATCH_SIZE = DEFAULT_PENDING_SHEET_BATCH_SIZE;

if (SHEET_RETRY_ENABLED) {
  cron.schedule(SHEET_RETRY_SCHEDULE, async () => {
    try {
      console.log("Running Sheet Retry Job...");
      const summary = await syncPendingSheetOrders({
        limit: SHEET_RETRY_BATCH_SIZE,
      });
      console.log("Sheet Retry Job finished:", summary);
    } catch (err) {
      console.log("Sheet Retry Job failed:", err.message);
    }
  });
}
