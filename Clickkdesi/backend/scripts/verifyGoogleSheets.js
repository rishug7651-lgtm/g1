import {
  getGoogleCredentialSource,
  getGoogleSheetCredentialStatus,
  verifyGoogleSheetAccess,
} from "../utils/googleSheet.js";

const credentialStatus = {
  googleCredentialSource: getGoogleCredentialSource(),
  ...getGoogleSheetCredentialStatus(),
};

console.log("Google Sheets credential status:", credentialStatus);

if (!credentialStatus.googleCredentialValid) {
  process.exitCode = 1;
} else {
  try {
    const sheet = await verifyGoogleSheetAccess();

    console.log("Google Sheets access verified:", sheet);
  } catch (err) {
    console.error("Google Sheets access failed:", {
      message: err.message,
      code: err.code,
      status: err.status,
    });
    process.exitCode = 1;
  }
}
