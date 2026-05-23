import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizePrivateKey = (value) => String(value || "").replace(/\\n/g, "\n");

const parseGoogleServiceAccountJson = (value, sourceName) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${sourceName} is not valid JSON: ${error.message}`);
  }
};

const loadGoogleCredentials = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return parseGoogleServiceAccountJson(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      "GOOGLE_SERVICE_ACCOUNT_JSON"
    );
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT?.trim().startsWith("{")) {
    return parseGoogleServiceAccountJson(
      process.env.GOOGLE_SERVICE_ACCOUNT,
      "GOOGLE_SERVICE_ACCOUNT"
    );
  }

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: "service_account",
      project_id:
        process.env.GOOGLE_PROJECT_ID ||
        process.env.GOOGLE_SERVICE_ACCOUNT ||
        undefined,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    };
  }

  const credentialsPath = path.join(__dirname, "../config/google.json");

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      "Google Sheets credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY, or restore backend/config/google.json locally."
    );
  }

  return parseGoogleServiceAccountJson(
    fs.readFileSync(credentialsPath, "utf8"),
    "backend/config/google.json"
  );
};

const SHEET_NAME = "Sheet1";
const SHEET_ID_RANGE = `'${SHEET_NAME}'!A2:A`;
const SHEET_DATA_RANGE = `'${SHEET_NAME}'!A:L`;
const sheetSaveLocks = new Map();
let sheetIdPromise;
let sheetsClient;

const getSpreadsheetId = () => {
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error("GOOGLE_SHEET_ID is missing.");
  }

  return process.env.GOOGLE_SHEET_ID;
};

const getSheetsClient = () => {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: loadGoogleCredentials(),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({
      version: "v4",
      auth,
    });
  }

  return sheetsClient;
};

/* ================= NORMALIZE ================= */

const normalize = (val) => String(val || "").trim();

/* ================= SAFE DATE FIX (🔥 MAIN FIX) ================= */

const getSafeDate = () => {
  try {
    const formatted = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `'${formatted}`; // 🔥 prevents Google Sheet auto-conversion
  } catch (err) {
    return `'${new Date().toISOString()}`; // fallback safety
  }
};

/* ================= CREATE ROW ================= */

const createRow = (order) => [
  normalize(order?._id),
  normalize(order?.shippingAddress?.name),
  normalize(order?.shippingAddress?.email),
  normalize(order?.shippingAddress?.phone),
  normalize(order?.shippingAddress?.address),
  normalize(order?.shippingAddress?.pincode),
  normalize(
    order?.products
      ?.map((p) => `${p?.name} (${p?.size})`)
      .join(", ")
  ),
  order?.totalAmount || 0,
  normalize(order?.couponCode),
  normalize(order?.paymentStatus),
  normalize(order?.paymentId),
  getSafeDate(), // ✅ FIX APPLIED HERE
];

/* ================= FIND ROW ================= */

const findRowIndexes = async (orderId) => {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: SHEET_ID_RANGE,
  });

  const rows = res.data.values || [];
  const targetId = normalize(orderId);
  const rowIndexes = [];

  for (let i = 0; i < rows.length; i++) {
    if (normalize(rows[i][0]) === targetId) {
      rowIndexes.push(i + 2);
    }
  }

  return rowIndexes;
};

const getSheetId = async () => {
  if (!sheetIdPromise) {
    const sheets = getSheetsClient();

    sheetIdPromise = sheets.spreadsheets
      .get({
        spreadsheetId: getSpreadsheetId(),
        fields: "sheets(properties(sheetId,title))",
      })
      .then((res) => {
        const sheet = res.data.sheets?.find(
          (item) => item.properties?.title === SHEET_NAME
        );

        if (!sheet) {
          throw new Error(`${SHEET_NAME} not found`);
        }

        return sheet.properties.sheetId;
      })
      .catch((err) => {
        sheetIdPromise = undefined;
        throw err;
      });
  }

  return sheetIdPromise;
};

const deleteDuplicateRows = async (rowIndexes) => {
  if (!rowIndexes.length) return;

  const sheets = getSheetsClient();
  const sheetId = await getSheetId();
  const requests = [...rowIndexes]
    .sort((a, b) => b - a)
    .map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowIndex - 1,
          endIndex: rowIndex,
        },
      },
    }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { requests },
  });
};

/* ================= SAVE / UPDATE ================= */

const saveOrderToSheetOnce = async (order, orderId) => {
  try {
    const rowData = createRow(order);

    console.log("🔥 Syncing order:", order._id);

    /* ================= DEBUG ================= */

    console.log("🧾 ORDER DETAILS:");
    console.log({
      id: order._id,
      name: order.shippingAddress?.name,
      email: order.shippingAddress?.email,
      amount: order.totalAmount,
      products: order.products,
    });

    /* ================= CHECK EXISTING ================= */

    const rowIndexes = await findRowIndexes(orderId);
    const rowIndex = rowIndexes[0] || -1;
    const duplicateRows = rowIndexes.slice(1);

    if (duplicateRows.length) {
      await deleteDuplicateRows(duplicateRows);
      console.log(`Removed ${duplicateRows.length} duplicate sheet row(s)`);
    }

    if (rowIndex !== -1) {
      /* ================= UPDATE ================= */
      const sheets = getSheetsClient();

      await sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `'${SHEET_NAME}'!A${rowIndex}:L${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData],
        },
      });

      console.log(`♻️ Updated row ${rowIndex}`);
    } else {
      /* ================= APPEND ================= */
      const sheets = getSheetsClient();

      await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: SHEET_DATA_RANGE,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowData],
        },
      });

      console.log("✅ Added new row");
    }
  } catch (err) {
    console.log("🚨 SHEET ERROR:", err.message);
    throw err;
  }
};

export const saveOrderToSheet = async (order) => {
  const orderId = normalize(order?._id);

  if (!orderId) return;

  const activeSave = sheetSaveLocks.get(orderId);

  if (activeSave) {
    console.log("Sheet save already running for order:", orderId);
    return activeSave;
  }

  const savePromise = saveOrderToSheetOnce(order, orderId).finally(() => {
    sheetSaveLocks.delete(orderId);
  });

  sheetSaveLocks.set(orderId, savePromise);

  return savePromise;
};
