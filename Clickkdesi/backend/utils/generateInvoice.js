import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoice = (order) => {

  return new Promise((resolve, reject) => {

    const filePath =
      path.join(
        process.cwd(),
        "invoices",
        `invoice-${order._id}.pdf`
      );

    const doc = new PDFDocument();

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.text("Pankuri Store Invoice");
    doc.text(`Order: ${order._id}`);
    doc.text(`Total: ₹${order.totalAmount}`);

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);   // ✅ wait complete
    });

    stream.on("error", reject);
  });
};