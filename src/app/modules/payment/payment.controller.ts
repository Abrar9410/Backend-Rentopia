import { Request, Response } from "express";
import { envVars } from "../../config/env";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";
import { JwtPayload } from "jsonwebtoken";
import { SSLServices } from "../sslCommerz/sslCommerz.service";

const initPayment = catchAsync(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    const result = await PaymentServices.initPaymentService(bookingId);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Payment done successfully",
        data: result,
    });
});

const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await PaymentServices.successPaymentService(query as Record<string, string>);

    if (result.success) {
        res.redirect(`${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
    };
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await PaymentServices.failPaymentService(query as Record<string, string>);

    if (!result.success) {
        res.redirect(`${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
    };
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await PaymentServices.cancelPaymentService(query as Record<string, string>);

    if (!result.success) {
        res.redirect(`${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`);
    };
});

const getInvoiceDownloadUrl = catchAsync(async (req: Request, res: Response) => {
        const decodedToken = req.user as JwtPayload;
        const { paymentId } = req.params;

        const result = await PaymentServices.getInvoiceDownloadUrlService(paymentId, decodedToken.userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Invoice download URL retrieved successfully",
            data: result,
        });
    }
);

const validatePayment = catchAsync(
    async (req: Request, res: Response) => {
        if (envVars.NODE_ENV === "development") {
            console.log("sslcommerz ipn url body", req.body);
        };

        await SSLServices.validatePayment(req.body);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Payment Validated Successfully",
            data: null,
        });
    }
);

export const PaymentControllers = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    validatePayment
};