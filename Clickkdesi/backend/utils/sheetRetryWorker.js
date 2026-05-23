import cron from "node-cron";
import Order from "../models/Order.js";
import { syncOrderToSheetOnce } from "./sheetSync.js";

const SHEET_RETRY_ENABLED = process.env.SHEET_RETRY_ENABLED !== "false";
const SHEET_RETRY_SCHEDULE = process.env.SHEET_RETRY_SCHEDULE || "*/15 * * * *";
const SHEET_RETRY_BATCH_SIZE = Number(process.env.SHEET_RETRY_BATCH_SIZE || 10);

if (SHEET_RETRY_ENABLED) {
cron.schedule(SHEET_RETRY_SCHEDULE, async () => {
  console.log("Running Sheet Retry Job...");

  const failedOrders = await Order.find({
    sheetSaved: false,
    paymentStatus: "paid",
    paymentId: { $exists: true, $ne: "" },
  })
    .select("_id paymentId")
    .sort({ updatedAt: 1 })
    .limit(SHEET_RETRY_BATCH_SIZE)
    .lean();

  for (const order of failedOrders) {
    if (!order.paymentId) {
      console.log("Skipping invalid order:", order._id);
      continue;
    }

    try {
      const { saved, skipped } = await syncOrderToSheetOnce(order._id);

      if (saved) {
        console.log(`Fixed order ${order._id}`);
      } else if (skipped) {
        console.log(`Sheet sync skipped for ${order._id}`);
      } else {
        console.log(`Still failing order ${order._id}`);
      }
    } catch (err) {
      console.log(`Still failing order ${order._id}:`, err.message);
    }
  }
});
}
