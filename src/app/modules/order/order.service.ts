/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payments } from "../payment/payment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLServices } from "../sslCommerz/sslCommerz.service";
import { Items } from "../item/item.model";
import { Users } from "../user/user.model";
import { ORDER_STATUS, IOrder } from "./order.interface";
import { Orders } from "./order.model";
import { getTransactionId } from "../../utils/getTransactionId";



const createOrderService = async (payload: Partial<IOrder>, userId: string) => {
    const transactionId = getTransactionId();

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        const user = await Users.findById(userId);

        if (!user?.phone || !user.address) {
            throw new AppError(httpStatus.BAD_REQUEST, "Please Update Your Profile to Book a Tour.")
        }

        const item = await Items.findById(payload.item);

        if (!item) {
            throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
        };

        if (!item?.pricePerDay) {
            throw new AppError(httpStatus.BAD_REQUEST, "No Price mentioned!");
        };

        if (!payload.startDate || !payload.endDate) {
            throw new AppError(httpStatus.BAD_REQUEST, "Start date and end date are required!");
        };

        // Extract date-only portion (YYYY-MM-DD)
        const startDateStr = payload.startDate.toISOString().slice(0, 10);
        const endDateStr = payload.endDate.toISOString().slice(0, 10);

        if (endDateStr < startDateStr) {
            throw new AppError(httpStatus.BAD_REQUEST, "End date must be the same or after start date!");
        };

        // Count days inclusively (same date = 1 day)
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const amount = Number(item.pricePerDay) * totalDays;

        const order = await Orders.create([{
            renter: userId,
            owner: item?.owner,
            status: ORDER_STATUS.PENDING,
            ...payload
        }], { session });

        const payment = await Payments.create([{
            order: order[0]._id,
            status: PAYMENT_STATUS.UNPAID,
            transactionId: transactionId,
            amount: amount
        }], { session });

        const updatedOrder = await Orders
            .findByIdAndUpdate(
                order[0]._id,
                { payment: payment[0]._id },
                { new: true, runValidators: true, session }
            )
            .populate("renter", "name email phone address")
            .populate("item", "title pricePerDay")
            .populate("payment");

        const userAddress = (updatedOrder?.renter as any).address;
        const userEmail = (updatedOrder?.renter as any).email;
        const userPhoneNumber = (updatedOrder?.renter as any).phone;
        const userName = (updatedOrder?.renter as any).name;

        const sslPayload: ISSLCommerz = {
            address: userAddress,
            email: userEmail,
            phoneNumber: userPhoneNumber,
            name: userName,
            amount: amount,
            transactionId: transactionId
        };

        const sslPayment = await SSLServices.sslPaymentInit(sslPayload);

        await session.commitTransaction(); //transaction
        session.endSession();

        return {
            paymentUrl: sslPayment.GatewayPageURL,
            order: updatedOrder
        };
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};

// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Complete -> Backend(localhost:5000/api/v1/payment/success) -> Update Payment(PAID) & Booking(CONFIRM) -> redirect to frontend -> Frontend(localhost:5173/payment/success)

// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Fail / Cancel -> Backend(localhost:5000) -> Update Payment(FAIL / CANCEL) & Booking(FAIL / CANCEL) -> redirect to frontend -> Frontend(localhost:5173/payment/cancel or localhost:5173/payment/fail)

const getUserOrdersService = async () => {

    return {}
};

const getOrderByIdService = async (id: string) => {
    const order = await Orders.findById(id);

    return order;
};

const updateOrderStatusService = async () => {

    return {}
};

const getAllOrdersService = async () => {

    return {}
};

export const OrderServices = {
    createOrderService,
    getUserOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    getAllOrdersService,
};