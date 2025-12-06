import { model, Schema } from "mongoose";
import { ORDER_STATUS, IOrder } from "./order.interface";


const orderSchema = new Schema<IOrder>({
    renter: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    item: {
        type: Schema.Types.ObjectId,
        ref: "Items",
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    payment: {
        type: Schema.Types.ObjectId,
        ref: "Payments"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.PENDING
    },
    ownerEarning: {
        type: Number,
        default: 0
    },
    platformFee: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

export const Orders = model<IOrder>("Orders", orderSchema);