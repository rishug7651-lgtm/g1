import { connectDB, disconnectDB } from "../config/db.js";
import Order from "../models/Order.js";
import {
  getGoogleCredentialSource,
  getGoogleSheetCredentialStatus,
  saveOrderToSheet,
  verifyGoogleSheetAccess,
} from "../utils/googleSheet.js";

const parseLimit = () => {
  const value = Number.parseInt(process.env.SHEET_SYNC_LIMIT || "", 10);

  if (Number.isNaN(value) || value < 1) {
    return 100;
  }

  return value;
};

const parseDateFilter = (name) => {
  if (!process.env[name]) return null;

  const date = new Date(process.env[name]);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${name} must be a valid date.`);
  }

  return date;
};

const buildQuery = () => {
  const query = {
    paymentStatus: "paid",
    paymentId: { $exists: true, $ne: "" },
  };
  const createdAt = {};
  const from = parseDateFilter("SHEET_RESYNC_FROM");
  const to = parseDateFilter("SHEET_RESYNC_TO");

  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  if (Object.keys(createdAt).length) query.createdAt = createdAt;

  return query;
};

const main = async () => {
  const credentialStatus = {
    googleCredentialSource: getGoogleCredentialSource(),
    ...getGoogleSheetCredentialStatus(),
  };

  console.log("Google Sheets credential status:", credentialStatus);

  if (!credentialStatus.googleCredentialValid) {
    throw new Error(credentialStatus.googleCredentialError);
  }

  await verifyGoogleSheetAccess();
  await connectDB({ label: "MongoDB for sheet row resync" });

  const orders = await Order.find(buildQuery())
    .sort({ createdAt: 1 })
    .limit(parseLimit());
  const summary = {
    found: orders.length,
    updated: 0,
    failed: 0,
  };

  for (const order of orders) {
    try {
      await saveOrderToSheet(order);
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            sheetSaved: true,
            sheetSaveInProgress: false,
          },
          $unset: {
            sheetSaveStartedAt: "",
          },
        },
        { timestamps: false }
      );
      summary.updated += 1;
      console.log(`Resynced sheet row for ${order._id}`);
    } catch (err) {
      summary.failed += 1;
      console.log(`Sheet row resync failed for ${order._id}:`, err.message);
    }
  }

  console.log("Sheet row resync complete:", summary);
};

main()
  .catch((err) => {
    console.error("Sheet row resync failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
