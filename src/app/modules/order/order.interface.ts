import { Types } from "mongoose";


export enum ORDER_STATUS {
    // REQUESTED = "REQUESTED",
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    ONGOING = "ONGOING",
    COMPLETED = "COMPLETED",
};

export interface IOrder {
    _id?: Types.ObjectId,
    renter: Types.ObjectId,
    item: Types.ObjectId,
    owner: Types.ObjectId,
    payment?: Types.ObjectId,
    startDate: Date | string,
    endDate: Date | string,
    status: ORDER_STATUS,
    ownerEarning?: number,
    platformFee?: number,
    createdAt?: Date,
    updatedAt?: Date
};