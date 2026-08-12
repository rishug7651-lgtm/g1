import { connectDB, disconnectDB } from "../config/db.js";
import {
  getGoogleCredentialSource,
  getGoogleSheetCredentialStatus,
  verifyGoogleSheetAccess,
} from "../utils/googleSheet.js";
import { syncPendingSheetOrders } from "../utils/sheetSync.js";

const parseLimit = () => {
  const value = Number.parseInt(process.env.SHEET_SYNC_LIMIT || "", 10);

  if (Number.isNaN(value) || value < 1) {
    return Number(process.env.SHEET_RETRY_BATCH_SIZE || 100);
  }

  return value;
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
  await connectDB({ label: "MongoDB for pending sheet sync" });

  const summary = await syncPendingSheetOrders({
    limit: parseLimit(),
    attempts: Number(process.env.SHEET_SYNC_ATTEMPTS || 3),
    retryDelayMs: Number(process.env.SHEET_SYNC_RETRY_DELAY_MS || 2000),
  });

  console.log("Pending sheet sync complete:", summary);
};

main()
  .catch((err) => {
    console.error("Pending sheet sync failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
