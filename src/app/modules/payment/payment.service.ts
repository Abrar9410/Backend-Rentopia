/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ORDER_STATUS, IOrder } from "../order/order.interface";
import { Orders } from "../order/order.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLServices } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payments } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { IItem } from "../item/item.interface";
import { IUser } from "../user/user.interface";
// import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { Users } from "../user/user.model";



const initPaymentService = async (orderId: string) => {

    const payment = await Payments.findOne({ order: orderId });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found. You have not rented this item!");
    };

    const order = await Orders.findById(payment.order);

    const userAddress = (order?.renter as any).address;
    const userEmail = (order?.renter as any).email;
    const userPhoneNumber = (order?.renter as any).phone;
    const userName = (order?.renter as any).name;

    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phoneNumber: userPhoneNumber,
        name: userName,
        amount: payment.amount,
        transactionId: payment.transactionId
    };

    const sslPayment = await SSLServices.sslPaymentInit(sslPayload);

    return {
        paymentUrl: sslPayment.GatewayPageURL
    };
};

const successPaymentService = async (query: Record<string, string>) => {

    // Update Order Status to ONGOING 
    // Update Payment Status to PAID

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payments.findOneAndUpdate(
            { transactionId: query.transactionId },
            { status: PAYMENT_STATUS.PAID },
            { new: true, runValidators: true, session: session }
        );

        if (!updatedPayment) {
            throw new AppError(httpStatus.EXPECTATION_FAILED, "Payment Status could Not be Updated!");
        };

        const updatedOrder = await Orders
            .findByIdAndUpdate(
                updatedPayment?.order,
                {
                    status: ORDER_STATUS.CONFIRMED,
                    ownerEarning: updatedPayment.amount * 0.9,
                    platformFee: updatedPayment.amount * 0.1
                },
                { new: true, runValidators: true, session }
            )
            .populate("item", "title")
            .populate("owner", "name email phone address")
            .populate("renter", "name email phone address");

        if (!updatedOrder) {
            throw new AppError(httpStatus.EXPECTATION_FAILED, "Order Status could Not be Updated!");
        };

        const updatedUser = await Users.findByIdAndUpdate(
            updatedOrder.owner,
            { $inc: { earnings: updatedPayment.amount * 0.9 } },
            { new: true, runValidators: true, session }
        );

        if (!updatedUser) {
            throw new AppError(httpStatus.EXPECTATION_FAILED, "Owner's Earnings could Not be Updated!");
        };

        const invoiceData: IInvoiceData = {
            orderDate: updatedOrder.createdAt as Date,
            startDate: updatedOrder.startDate as Date,
            endDate: updatedOrder.endDate as Date,
            totalAmount: updatedPayment.amount,
            itemTitle: (updatedOrder.item as unknown as IItem).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedOrder.renter as unknown as IUser).name,
            ownerName: updatedUser.name
        };

        const pdfBuffer = await generatePdf(invoiceData);

        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

        if (!cloudinaryResult) {
            throw new AppError(httpStatus.CONFLICT, "Error uploading pdf!");
        };

        await Payments
            .findByIdAndUpdate(
                updatedPayment._id,
                { invoiceUrl: cloudinaryResult.secure_url },
                { runValidators: true, session }
            );

        // await sendEmail({
        //     to: (updatedOrder.renter as unknown as IUser).email,
        //     cc: (updatedOrder.owner as unknown as IUser).email,
        //     subject: "Your Order Invoice",
        //     templateName: "invoice",
        //     templateData: invoiceData,
        //     attachments: [
        //         {
        //             filename: "invoice.pdf",
        //             content: pdfBuffer,
        //             contentType: "application/pdf"
        //         }
        //     ]
        // });

        await session.commitTransaction(); //transaction
        session.endSession();

        return { success: true, message: "Payment Completed Successfully!" };
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};

const failPaymentService = async (query: Record<string, string>) => {

    // Update Order Status to FAIL
    // Update Payment Status to FAIL

    const session = await Orders.startSession();
    session.startTransaction();

    try {


        const updatedPayment = await Payments.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.FAILED,
        }, { new: true, runValidators: true, session: session });

        await Orders
            .findByIdAndUpdate(
                updatedPayment?.order,
                { status: ORDER_STATUS.FAILED },
                { runValidators: true, session }
            );

        await session.commitTransaction(); //transaction
        session.endSession();
        return { success: false, message: "Payment Failed" }
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession();
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error
    }
};

const cancelPaymentService = async (query: Record<string, string>) => {

    // Update Order Status to CANCEL
    // Update Payment Status to CANCEL

    const session = await Orders.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payments.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.CANCELLED,
        }, { runValidators: true, session: session });

        await Orders
            .findByIdAndUpdate(
                updatedPayment?.order,
                { status: ORDER_STATUS.CANCELLED },
                { runValidators: true, session }
            );

        await session.commitTransaction(); //transaction
        session.endSession();

        return { success: false, message: "Payment Cancelled" };
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession();
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};

const getInvoiceDownloadUrlService = async (paymentId: string, userId: string) => {
    const payment = await Payments.findById(paymentId).populate({
        path: "order",
        select: "renter owner"
    }).select("invoiceUrl order");

    if (!payment) {
        throw new AppError(404, "Payment not found!");
    };

    const order = payment.order as unknown as IOrder;

    const renterId = order.renter.toString();
    const ownerId = order.owner.toString();

    if (renterId !== userId && ownerId !== userId) {
        throw new AppError(403, "You are not permitted to view this route!");
    };

    if (!payment.invoiceUrl) {
        throw new AppError(404, "No invoice found!");
    };

    return payment.invoiceUrl;
};

const getPaymentByTransactionIdService = async (transactionId: string, userId: string) => {
    const payment = await Payments.findOne({ transactionId }).populate("order", "renter");

    if (!payment) {
        throw new AppError(404, "Payment not found!");
    };

    if ((payment.order as unknown as IOrder).renter.toString() !== userId) {
        throw new AppError(403, "You are Not permitted to View this route!");
    };

    return payment;
};


export const PaymentServices = {
    initPaymentService,
    successPaymentService,
    failPaymentService,
    cancelPaymentService,
    getInvoiceDownloadUrlService,
    getPaymentByTransactionIdService
};