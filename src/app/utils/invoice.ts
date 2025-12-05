/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";

export interface IInvoiceData {
    transactionId: string;
    orderDate: Date;
    userName: string;
    itemTitle: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
};

export const generatePdf = async (invoiceData: IInvoiceData): Promise<Buffer<ArrayBufferLike>> => {
    try {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 50 })
            const buffer: Uint8Array[] = [];

            doc.on("data", (chunk) => buffer.push(chunk))
            doc.on("end", () => resolve(Buffer.concat(buffer)))
            doc.on("error", (err) => reject(err))

            //PDF Content
            doc.fontSize(20).text("Invoice", { align: "center" });

            doc.moveDown();

            doc.fontSize(14).text(`Transaction ID : ${invoiceData.transactionId}`);
            doc.text(`Booking Date : ${invoiceData.orderDate}`);
            doc.text(`Customer : ${invoiceData.userName}`);

            doc.moveDown();

            doc.text(`Item: ${invoiceData.itemTitle}`);
            doc.text(`Start-Date: ${invoiceData.startDate}`);
            doc.text(`End-Date: ${invoiceData.endDate}`);
            doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`);

            doc.moveDown();

            doc.text("Thank you for booking with us!", { align: "center" });

            doc.end();
        })
    } catch (error: any) {
        if (envVars.NODE_ENV === "development") {
            console.log(error);
        };
        throw new AppError(401, `Pdf creation error ${error.message}`);
    }
};