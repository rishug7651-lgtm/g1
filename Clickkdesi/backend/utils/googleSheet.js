import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizePrivateKey = (value) => {
  let key = String(value || "").trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n");
};

const validatePrivateKey = (value, sourceName) => {
  const privateKey = normalizePrivateKey(value);

  try {
    crypto.createPrivateKey(privateKey);
  } catch {
    throw new Error(`Google Sheets private key is invalid for ${sourceName}.`);
  }

  return privateKey;
};

const parseGoogleServiceAccountJson = (value, sourceName) => {
  try {
    const credentials = JSON.parse(value);

    if (!credentials.client_email) {
      throw new Error("client_email is missing");
    }

    if (!credentials.private_key) {
      throw new Error("private_key is missing");
    }

    return {
      ...credentials,
      private_key: validatePrivateKey(credentials.private_key, sourceName),
    };
  } catch (error) {
    throw new Error(`${sourceName} is invalid: ${error.message}`);
  }
};

const getGoogleProjectId = () => {
  const legacyProjectId = String(process.env.GOOGLE_SERVICE_ACCOUNT || "").trim();

  if (legacyProjectId.startsWith("{")) {
    return process.env.GOOGLE_PROJECT_ID || undefined;
  }

  return process.env.GOOGLE_PROJECT_ID || legacyProjectId || undefined;
};

const loadGoogleCredentials = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return parseGoogleServiceAccountJson(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      "GOOGLE_SERVICE_ACCOUNT_JSON"
    );
  }

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: "service_account",
      project_id: getGoogleProjectId(),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: validatePrivateKey(
        process.env.GOOGLE_PRIVATE_KEY,
        "GOOGLE_PRIVATE_KEY"
      ),
    };
  }

  const credentialsPath = path.join(__dirname, "../config/google.json");

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      "Google Sheets credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY, or restore backend/config/google.json locally."
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Google Sheets credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY in Render."
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

const normalize = (val) => String(val || "").trim();

const getIndiaTimestamp = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const getSafeDate = () => {
  try {
    return `'${getIndiaTimestamp()}`;
  } catch (err) {
    return `'${new Date().toISOString()}`;
  }
};

const maskPhone = (phone) => {
  const digits = normalize(phone).replace(/\D/g, "");

  if (!digits) return "";

  return `****${digits.slice(-4)}`;
};

const maskEmail = (email) => {
  const value = normalize(email);
  const [local, domain] = value.split("@");

  if (!local || !domain) return "";

  return `${local.slice(0, 2)}***@${domain}`;
};

const maskName = (name) => {
  const value = normalize(name);

  if (value.length <= 2) return value;

  return `${value.slice(0, 1)}***${value.slice(-1)}`;
};

const addressPreview = (address) => {
  const value = normalize(address).replace(/\s+/g, " ");

  if (value.length <= 60) return value;

  return `${value.slice(0, 60)}...`;
};

const productSummary = (products = []) =>
  products.map((product) => ({
    name: normalize(product?.name),
    size: normalize(product?.size),
    quantity: Number(product?.quantity || 0),
  }));

const buildMaskedOrderLog = (order) => ({
  orderId: normalize(order?._id),
  customerName: maskName(order?.shippingAddress?.name),
  email: maskEmail(order?.shippingAddress?.email),
  phone: maskPhone(order?.shippingAddress?.phone),
  pincode: normalize(order?.shippingAddress?.pincode),
  addressPreview: addressPreview(order?.shippingAddress?.address),
  amount: order?.totalAmount || 0,
  paymentStatus: normalize(order?.paymentStatus),
  dateTimeIst: getIndiaTimestamp(),
  products: productSummary(order?.products),
});

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
  getSafeDate(),
];

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

const saveOrderToSheetOnce = async (order, orderId) => {
  try {
    const rowData = createRow(order);

    console.log("Syncing order to sheet:", normalize(order._id));
    console.log("Masked order details:", buildMaskedOrderLog(order));

    const rowIndexes = await findRowIndexes(orderId);
    const rowIndex = rowIndexes[0] || -1;
    const duplicateRows = rowIndexes.slice(1);

    if (duplicateRows.length) {
      await deleteDuplicateRows(duplicateRows);
      console.log(`Removed ${duplicateRows.length} duplicate sheet row(s)`);
    }

    if (rowIndex !== -1) {
      const sheets = getSheetsClient();

      await sheets.spreadsheets.values.update({
        spreadsheetId: getSpreadsheetId(),
        range: `'${SHEET_NAME}'!A${rowIndex}:L${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData],
        },
      });

      console.log(`Updated sheet row ${rowIndex}`);
    } else {
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

      console.log("Added new sheet row");
    }
  } catch (err) {
    console.log("SHEET ERROR:", {
      message: err.message,
      code: err.code,
      status: err.status,
    });
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
