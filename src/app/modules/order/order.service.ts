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
import { QueryBuilder } from "../../utils/QueryBuilder";
import { orderSearchableFields } from "./order.constant";
import { Current_Status } from "../item/item.interface";



const createOrderService = async (payload: Partial<IOrder>, userId: string) => {
    const transactionId = getTransactionId();

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        const user = await Users.findById(userId);

        if (!user?.phone || !user.address) {
            throw new AppError(httpStatus.BAD_REQUEST, "Please Update Your Profile to Rent an Item.")
        }

        const item = await Items.findById(payload.item);

        if (!item) {
            throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
        };

        if (userId === item.owner.toString()) {
            throw new AppError(httpStatus.BAD_REQUEST, "You cannot rent your own item!");
        };

        if (item.current_status !== Current_Status.AVAILABLE) {
            throw new AppError(httpStatus.NOT_ACCEPTABLE, "Item is currently not available for rent!");
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

        item.adv_bookings.forEach(booking => {
            const bookedStartDateStr = booking.startDate.toISOString().slice(0, 10);
            const bookedEndDateStr = booking.endDate.toISOString().slice(0, 10);

            if (
                (startDateStr >= bookedStartDateStr && startDateStr <= bookedEndDateStr) ||
                (endDateStr >= bookedStartDateStr && endDateStr <= bookedEndDateStr) ||
                (startDateStr <= bookedStartDateStr && endDateStr >= bookedEndDateStr)
            ) {
                throw new AppError(httpStatus.CONFLICT, `Item is already booked from ${bookedStartDateStr} to ${bookedEndDateStr}. Please choose different dates.`);
            };
        });

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

        await Items.findByIdAndUpdate(
            item?._id,
            {
                $push: {
                    adv_bookings: {
                        startDate: payload.startDate,
                        endDate: payload.endDate
                    }
                }
            },
            { runValidators: true, session }
        );

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

// Frontend(localhost:5173) - User - Item - Order (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Complete -> Backend(localhost:5000/api/v1/payment/success) -> Update Payment(PAID) & Booking(CONFIRM) -> redirect to frontend -> Frontend(localhost:5173/payment/success)

// Frontend(localhost:5173) - User - Item - Order (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Fail / Cancel -> Backend(localhost:5000) -> Update Payment(FAIL / CANCEL) & Booking(FAIL / CANCEL) -> redirect to frontend -> Frontend(localhost:5173/payment/cancel or localhost:5173/payment/fail)

const getUserOrdersService = async (userId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Orders.find({renter: userId}), query)
        .filter()
        .search(orderSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getOrderByIdService = async (id: string) => {
    const order = await Orders.findById(id);

    return order;
};

const updateOrderStatusService = async () => {

    return {}
};

const getAllOrdersService = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Orders.find(), query)
        .filter()
        .search(orderSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const deleteUnpaidOrdersService = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        const unpaidOrders = await Orders.find({
            createdAt: { $lte: thirtyMinutesAgo },
            status: ORDER_STATUS.PENDING
        }).session(session);

        const orderIds = unpaidOrders.map(order => order._id);

        await Payments.deleteMany({
            order: { $in: orderIds },
            status: PAYMENT_STATUS.UNPAID
        }).session(session);

        await Orders.deleteMany({
            _id: { $in: orderIds },
            status: ORDER_STATUS.PENDING
        }).session(session);

        unpaidOrders.forEach(async (order) => {
            const item = await Items.findById(order.item).session(session);
            if (item) {
                item.adv_bookings = item.adv_bookings.filter(booking =>
                    !(
                        booking.startDate.getTime() === order.startDate.getTime() &&
                        booking.endDate.getTime() === order.endDate.getTime()
                    )
                );
                await item.save({ session });
            };
        });

        await session.commitTransaction(); //transaction
        session.endSession();
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};


export const OrderServices = {
    createOrderService,
    getUserOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    getAllOrdersService,
    deleteUnpaidOrdersService
};