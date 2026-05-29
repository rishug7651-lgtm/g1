import Order from "../models/Order.js";
import { saveOrderToSheet } from "./googleSheet.js";

const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
