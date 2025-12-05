/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS, IBooking } from "../booking/booking.interface";
import { Bookings } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLServices } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payments } from "./payment.model";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";

const initPaymentService = async (bookingId: string) => {

    const payment = await Payments.findOne({ booking: bookingId });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found. You have not booked this tour");
    };

    const booking = await Bookings.findById(payment.booking);

    const userAddress = (booking?.user as any).address;
    const userEmail = (booking?.user as any).email;
    const userPhoneNumber = (booking?.user as any).phone;
    const userName = (booking?.user as any).name;

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

    // Update Booking Status to COnfirm 
    // Update Payment Status to PAID

    const session = await Bookings.startSession();
    session.startTransaction();

    try {


        const updatedPayment = await Payments.findOneAndUpdate(
            { transactionId: query.transactionId },
            { status: PAYMENT_STATUS.PAID },
            { new: true, runValidators: true, session: session }
        );

        if (!updatedPayment) {
            throw new AppError(401, "Payment Status could Not be Updated!");
        };

        const updatedBooking = await Bookings
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email");

        if (!updatedBooking) {
            throw new AppError(401, "Booking Status could Not be Updated!");
        };

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.amount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        };

        const pdfBuffer = await generatePdf(invoiceData);

        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

        if (!cloudinaryResult) {
            throw new AppError(401, "Error uploading pdf");
        };

        await Payments
            .findByIdAndUpdate(
                updatedPayment._id,
                { invoiceUrl: cloudinaryResult.secure_url },
                { runValidators: true, session }
            );

        await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
            subject: "Your Booking Invoice",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });

        await session.commitTransaction(); //transaction
        session.endSession();
        return { success: true, message: "Payment Completed Successfully" };
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};

const failPaymentService = async (query: Record<string, string>) => {

    // Update Booking Status to FAIL
    // Update Payment Status to FAIL

    const session = await Bookings.startSession();
    session.startTransaction();

    try {


        const updatedPayment = await Payments.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.FAILED,
        }, { new: true, runValidators: true, session: session });

        await Bookings
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.FAILED },
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

    // Update Booking Status to CANCEL
    // Update Payment Status to CANCEL

    const session = await Bookings.startSession();
    session.startTransaction()

    try {


        const updatedPayment = await Payments.findOneAndUpdate({ transactionId: query.transactionId }, {
            status: PAYMENT_STATUS.CANCELLED,
        }, { runValidators: true, session: session });

        await Bookings
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.CANCEL },
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
    // NEXT LINE SHOULD BE CHECKED; SEEMS DOUBTFUL; CAN "populate" BE USED LIKE THIS???
    const payment = await Payments.findById(paymentId).populate("booking", "user").select("invoiceUrl booking");

    if (!payment) {
        throw new AppError(404, "Payment not found!");
    };

    if ((payment.booking as unknown as IBooking).user.toString() !== userId) {
        throw new AppError(403, "You are Not permitted to View this route!");
    };

    if (!payment.invoiceUrl) {
        throw new AppError(404, "No invoice found!");
    };

    return payment.invoiceUrl;
};


export const PaymentServices = {
    initPaymentService,
    successPaymentService,
    failPaymentService,
    cancelPaymentService,
    getInvoiceDownloadUrlService
};