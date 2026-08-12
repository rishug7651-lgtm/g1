import Order from "../models/Order.js";
import { saveOrderToSheet } from "./googleSheet.js";

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
export const DEFAULT_PENDING_SHEET_BATCH_SIZE = Number(
  process.env.SHEET_RETRY_BATCH_SIZE || 10
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const findPendingSheetOrders = ({
  limit = DEFAULT_PENDING_SHEET_BATCH_SIZE,
} = {}) =>
  Order.find({
    sheetSaved: { $ne: true },
    paymentStatus: "paid",
    paymentId: { $exists: true, $ne: "" },
  })
    .select("_id paymentId")
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean();

const claimSheetSync = async (orderId) => {
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS);

  return Order.findOneAndUpdate(
    {
      _id: orderId,
      sheetSaved: { $ne: true },
      $or: [
        { sheetSaveInProgress: { $ne: true } },
        { sheetSaveStartedAt: { $lt: staleBefore } },
        { sheetSaveStartedAt: { $exists: false } },
      ],
    },
    {
      $set: {
        sheetSaveInProgress: true,
        sheetSaveStartedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
};

const finishSheetSync = async (orderId, sheetSaved) => {
  await Order.updateOne(
    { _id: orderId },
    {
      $set: {
        sheetSaved,
        sheetSaveInProgress: false,
      },
      $unset: {
        sheetSaveStartedAt: "",
      },
    }
  );
};

export const syncOrderToSheetOnce = async (
  orderOrId,
  { attempts = 3, retryDelayMs = 2000 } = {}
) => {
  const orderId = orderOrId?._id || orderOrId;

  if (!orderId) {
    return { saved: false, skipped: true };
  }

  const order = await claimSheetSync(orderId);

  if (!order) {
    console.log("Sheet sync already claimed or completed:", orderId);
    return { saved: false, skipped: true };
  }

  let saved = false;

  for (let i = 0; i < attempts; i++) {
    try {
      await saveOrderToSheet(order);
      console.log(`Sheet saved (attempt ${i + 1})`);
      saved = true;
      break;
    } catch (err) {
      console.log(`Sheet retry ${i + 1} failed:`, err.message);

      if (i < attempts - 1) {
        await sleep(retryDelayMs);
      }
    }
  }

  await finishSheetSync(order._id, saved);

  return { saved, skipped: false };
};

export const syncPendingSheetOrders = async ({
  limit = DEFAULT_PENDING_SHEET_BATCH_SIZE,
  attempts = 3,
  retryDelayMs = 2000,
} = {}) => {
  const pendingOrders = await findPendingSheetOrders({ limit });
  const summary = {
    found: pendingOrders.length,
    saved: 0,
    skipped: 0,
    failed: 0,
  };

  for (const order of pendingOrders) {
    if (!order.paymentId) {
      console.log("Skipping invalid order:", order._id);
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await syncOrderToSheetOnce(order._id, {
        attempts,
        retryDelayMs,
      });

      if (result.saved) {
        summary.saved += 1;
        console.log(`Fixed order ${order._id}`);
      } else if (result.skipped) {
        summary.skipped += 1;
        console.log(`Sheet sync skipped for ${order._id}`);
      } else {
        summary.failed += 1;
        console.log(`Still failing order ${order._id}`);
      }
    } catch (err) {
      summary.failed += 1;
      console.log(`Still failing order ${order._id}:`, err.message);
    }
  }

  return summary;
};
