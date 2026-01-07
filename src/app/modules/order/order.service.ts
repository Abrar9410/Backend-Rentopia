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
import { Current_Status } from "../item/item.interface";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { differenceInCalendarDays, endOfDay, format, isAfter, isBefore, isToday, isWithinInterval, parseISO, startOfDay } from "date-fns";



const createOrderService = async (payload: Partial<IOrder>, userId: string) => {
    const transactionId = getTransactionId();

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        const user = await Users.findById(userId);

        if (!user?.phone || !user?.address) {
            throw new AppError(httpStatus.BAD_REQUEST, "Please Update Your Profile to Rent an Item.")
        };

        const item = await Items.findById(payload.item);

        if (!item) {
            throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
        };

        if (userId === item.owner.toString()) {
            throw new AppError(httpStatus.BAD_REQUEST, "You cannot rent your own item!");
        };


        if (!item?.pricePerDay) {
            throw new AppError(httpStatus.BAD_REQUEST, "No Price mentioned!");
        };

        if (!payload.startDate || !payload.endDate) {
            throw new AppError(httpStatus.BAD_REQUEST, "Start-date and End-date are required!");
        };

        const { startDate: payloadStartDate, endDate: payloadEndDate } = payload;
        const startDate = startOfDay(parseISO(payloadStartDate as string));
        const endDate = endOfDay(parseISO(payloadEndDate as string));

        if (
            item.current_status !== Current_Status.AVAILABLE &&
            isToday(startDate)
        ) {
            throw new AppError(httpStatus.NOT_ACCEPTABLE, "Item is currently not available for rent!");
        };

        if (isBefore(endDate, startDate)) {
            throw new AppError(httpStatus.BAD_REQUEST, "End date must be the same or after start date!");
        };

        item.adv_bookings.forEach(booking => {
            const bookedStart = startOfDay(booking.startDate as Date);
            const bookedEnd = endOfDay(booking.endDate as Date);

            const isOverlap = !isBefore(endDate, bookedStart) && !isAfter(startDate, bookedEnd);

            if (isOverlap) {
                throw new AppError(
                    httpStatus.CONFLICT,
                    `Item is already booked from ${format(booking.startDate, "PP")} to ${format(booking.endDate, "PP")}. Please choose different dates.`
                );
            }
        });

        if (
            item.current_status === Current_Status.AVAILABLE &&
            isToday(startDate)
        ) {
            item.current_status = Current_Status.OCCUPIED;
            await item.save({ session });
        };


        // Count days inclusively (same date = 1 day)
        const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

        // Total amount
        const amount = Number(item.pricePerDay) * totalDays;

        const order = await Orders.create([{
            renter: userId,
            item: item._id,
            owner: item?.owner,
            status: ORDER_STATUS.PENDING,
            startDate,
            endDate,
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

const getAllOrdersService = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Orders.find(), query)
        .filter()
        .search([])
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build()
            .populate("item")
            .populate("payment")
            .populate("owner", "name email phone address picture role")
            .populate("renter", "name email phone address picture role"),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getMyOrdersService = async (userId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Orders.find({ renter: userId }), query)
        .filter()
        .search([])
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build()
            .populate("item")
            .populate("payment")
            .populate("owner", "name picture email phone role")
            .populate("renter", "name"),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getCustomerOrdersService = async (userId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Orders.find({ owner: userId }), query)
        .filter()
        .search([])
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build()
            .populate("item")
            .populate("payment")
            .populate("owner", "name")
            .populate("renter", "name picture email phone role"),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getOrderByIdService = async (decodedToken: JwtPayload, orderId: string) => {
    const user = await Users.findById(decodedToken.userId);
    if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not found!");
    };

    const order = await Orders.findById(orderId);
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found!");
    };

    if (
        order.renter.toString() !== decodedToken.userId &&
        order.owner.toString() !== decodedToken.userId &&
        user.role !== Role.ADMIN
    ) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this order!");
    };

    return order;
};

const updateOrderStatusService = async (id: string, payload: { status: ORDER_STATUS }) => {
    const updatedOrder = await Orders.findByIdAndUpdate(
        id,
        { status: payload.status },
        { new: true, runValidators: true }
    );

    if (!updatedOrder) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found!");
    };

    return updatedOrder;
};

export const deleteUnpaidOrdersService = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const session = await Orders.startSession();
    session.startTransaction();

    try {
        // 1️⃣ Find unpaid orders older than 30 minutes
        const unpaidOrders = await Orders.find({
            createdAt: { $lte: thirtyMinutesAgo },
            status: ORDER_STATUS.PENDING,
        }).session(session);

        if (unpaidOrders.length < 1) {
            await session.commitTransaction();
            session.endSession();
            return;
        };

        const orderIds = unpaidOrders.map(order => order._id);

        // 2️⃣ Delete unpaid payments
        await Payments.deleteMany({
            order: { $in: orderIds },
            status: PAYMENT_STATUS.UNPAID,
        }).session(session);

        // 3️⃣ Remove adv_bookings safely (DAY-BASED, NOT TIME-BASED)
        for (const order of unpaidOrders) {
            const startDayStart = startOfDay(new Date(order.startDate));
            const startDayEnd = endOfDay(new Date(order.startDate));

            const endDayStart = startOfDay(new Date(order.endDate));
            const endDayEnd = endOfDay(new Date(order.endDate));

            const item = await Items.findByIdAndUpdate(
                order.item,
                {
                    $pull: {
                        adv_bookings: {
                            startDate: { $gte: startDayStart, $lte: startDayEnd },
                            endDate: { $gte: endDayStart, $lte: endDayEnd },
                        },
                    },
                },
                { new: true, runValidators: true, session }
            );

            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());

            const orderCoversToday =
                new Date(order.startDate) <= todayEnd &&
                new Date(order.endDate) >= todayStart;

            if (orderCoversToday && item?.current_status === Current_Status.OCCUPIED) {
                await Items.updateOne(
                    { _id: order.item },
                    { $set: { current_status: Current_Status.AVAILABLE } },
                    { session }
                );
            }
        };

        // 4️⃣ Delete unpaid orders
        await Orders.deleteMany({
            _id: { $in: orderIds },
            status: ORDER_STATUS.PENDING,
        }).session(session);

        // 5️⃣ Commit transaction
        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        await session.abortTransaction(); // rollback
        session.endSession()
        // throw new AppError(httpStatus.BAD_REQUEST, error) ❌❌
        throw error;
    }
};

export const updateStatusAndDeleteOldBookingsOfItems = async () => {

    const todayStart = startOfDay(new Date());

    // 1️⃣ Fetch ALL items that have adv_bookings
    const items = await Items.find({
        adv_bookings: { $exists: true, $ne: [] },
    });

    for (const item of items) {
        let statusChanged = false;

        // 2️⃣ Remove expired bookings (endDate < today start)
        const validBookings = item.adv_bookings.filter(booking => {
            return booking.endDate >= todayStart;
        });

        // 3️⃣ Check if today is covered by any booking
        const isBookedToday = validBookings.some(booking =>
            isWithinInterval(todayStart, {
                start: startOfDay(new Date(booking.startDate)),
                end: endOfDay(new Date(booking.endDate)),
            })
        );

        // 4️⃣ Update status based on bookings
        if (isBookedToday && item.current_status === Current_Status.AVAILABLE) {
            item.current_status = Current_Status.OCCUPIED;
            statusChanged = true;
        };

        if (!isBookedToday && item.current_status === Current_Status.OCCUPIED) {
            item.current_status = Current_Status.AVAILABLE;
            statusChanged = true;
        };

        // 5️⃣ Save only if something changed
        if (
            statusChanged ||
            validBookings.length !== item.adv_bookings.length
        ) {
            item.adv_bookings = validBookings;
            await item.save();
        };
    };
};



export const OrderServices = {
    createOrderService,
    getAllOrdersService,
    getMyOrdersService,
    getCustomerOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
};