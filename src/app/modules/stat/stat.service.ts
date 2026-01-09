import { Types } from "mongoose";
import { Items } from "../item/item.model";
import { ORDER_STATUS } from "../order/order.interface";
import { Orders } from "../order/order.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payments } from "../payment/payment.model";
import { Role } from "../user/user.interface";
import { Users } from "../user/user.model";



export const getStatsForAdminService = async () => {
    const [
        totalUsers,
        totalAdmins,
        totalItems,
        activeOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        unpaidPayments,
        orderStatusDistribution,
        monthlyRevenue
    ] = await Promise.all([
        Users.countDocuments(),
        Users.countDocuments({ role: Role.ADMIN }),
        Items.countDocuments(),

        Orders.countDocuments({
            status: { $in: [ORDER_STATUS.ONGOING, ORDER_STATUS.CONFIRMED] },
        }),

        Orders.countDocuments({ status: ORDER_STATUS.COMPLETED }),

        Orders.countDocuments({ status: ORDER_STATUS.PENDING }),

        Payments.aggregate([
            { $match: { status: PAYMENT_STATUS.PAID } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]),

        Payments.countDocuments({ status: PAYMENT_STATUS.UNPAID }),

        Orders.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]),

        Payments.aggregate([
            { $match: { status: PAYMENT_STATUS.PAID } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ])
    ]);

    return {
        users: {
            total: totalUsers,
            admins: totalAdmins,
            regularUsers: totalUsers - totalAdmins,
        },
        items: {
            total: totalItems,
        },
        orders: {
            active: activeOrders,
            completed: completedOrders,
            pending: pendingOrders,
        },
        revenue: {
            total: totalRevenue[0]?.total || 0,
        },
        payments: {
            unpaid: unpaidPayments,
        },
        charts: {
            orderStatusDistribution,
            monthlyRevenue
        }
    };
};

export const getStatsForUserService = async (userId: string) => {
    const userObjectId = new Types.ObjectId(userId);

    const [
        itemsListed,
        activeRentalsAsRenter,
        completedRentalsAsRenter,
        activeRentalsAsOwner,
        completedRentalsAsOwner,
        totalEarnings,
        totalSpent,
        monthlySpending,
        monthlyEarnings,
        orderStatusDistribution
    ] = await Promise.all([
        // Items listed by user
        Items.countDocuments({ owner: userObjectId }),

        // Renter stats
        Orders.countDocuments({
            renter: userObjectId,
            status: { $in: [ORDER_STATUS.ONGOING, ORDER_STATUS.CONFIRMED] },
        }),

        Orders.countDocuments({
            renter: userObjectId,
            status: ORDER_STATUS.COMPLETED,
        }),

        // Owner stats
        Orders.countDocuments({
            owner: userObjectId,
            status: { $in: [ORDER_STATUS.ONGOING, ORDER_STATUS.CONFIRMED] },
        }),

        Orders.countDocuments({
            owner: userObjectId,
            status: ORDER_STATUS.COMPLETED,
        }),

        // Earnings (Owner)
        Orders.aggregate([
            {
                $match: {
                    owner: userObjectId,
                    status: ORDER_STATUS.COMPLETED,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$ownerEarning" },
                },
            },
        ]),

        // Spending (Renter)
        Payments.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "order",
                    foreignField: "_id",
                    as: "orderData",
                },
            },
            { $unwind: "$orderData" },
            {
                $match: {
                    "orderData.renter": userObjectId,
                    status: PAYMENT_STATUS.PAID,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]),

        // Monthly Spending (Renter)
        Payments.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "order",
                    foreignField: "_id",
                    as: "orderData",
                },
            },
            { $unwind: "$orderData" },
            {
                $match: {
                    "orderData.renter": userObjectId,
                    status: PAYMENT_STATUS.PAID,
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" },
                },
            },
            { $sort: { "_id": 1 } },
        ]),

        // Monthly Earnings (Owner)
        Orders.aggregate([
            {
                $match: {
                    owner: userObjectId,
                    status: ORDER_STATUS.COMPLETED,
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$ownerEarning" },
                },
            },
            { $sort: { "_id": 1 } },
        ]),

        // Order Status Distribution

        Orders.aggregate([
            {
                $match: {
                    $or: [
                        { renter: userObjectId },
                        { owner: userObjectId },
                    ],
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ])
    ]);

    return {
        listings: {
            itemsListed,
        },
        renting: {
            active: activeRentalsAsRenter,
            completed: completedRentalsAsRenter,
            totalSpent: totalSpent[0]?.total || 0,
        },
        earning: {
            active: activeRentalsAsOwner,
            completed: completedRentalsAsOwner,
            totalEarned: totalEarnings[0]?.total || 0,
        },
        charts: {
            monthlySpending,
            monthlyEarnings,
            orderStatusDistribution,
        }
    };
};


export const statServices = {
    getStatsForAdminService,
    getStatsForUserService
};