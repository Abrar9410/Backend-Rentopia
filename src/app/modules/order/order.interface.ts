import { Types } from "mongoose";


export enum ORDER_STATUS {
    // REQUESTED = "REQUESTED",
    PENDING = "PENDING",
    CANCELED = "CANCELED",
    ONGOING = "ONGOING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
};

export interface IOrder {
    _id?: Types.ObjectId,
    renter: Types.ObjectId,
    item: Types.ObjectId,
    owner: Types.ObjectId,
    payment?: Types.ObjectId,
    startDate: Date,
    endDate: Date,
    status: ORDER_STATUS,
    createdAt?: Date,
    updatedAt?: Date
};