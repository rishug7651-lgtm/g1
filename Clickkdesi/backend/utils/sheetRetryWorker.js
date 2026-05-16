import cron from "node-cron";
import Order from "../models/Order.js";
import { syncOrderToSheetOnce } from "./sheetSync.js";

cron.schedule("*/5 * * * *", async () => {
  console.log("Running Sheet Retry Job...");

  const failedOrders = await Order.find({
    sheetSaved: false,
    paymentStatus: "paid",
  });

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
