import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../config/google.json"),
    "utf8"
  )
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";
const SHEET_ID_RANGE = `'${SHEET_NAME}'!A2:A`;
const SHEET_DATA_RANGE = `'${SHEET_NAME}'!A:L`;
const sheetSaveLocks = new Map();
let sheetIdPromise;

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
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
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
    sheetIdPromise = sheets.spreadsheets
      .get({
        spreadsheetId: SPREADSHEET_ID,
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
    spreadsheetId: SPREADSHEET_ID,
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

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!A${rowIndex}:L${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData],
        },
      });

      console.log(`♻️ Updated row ${rowIndex}`);
    } else {
      /* ================= APPEND ================= */

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
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
