import { Schema, model } from 'mongoose';
import { Current_Status, IItem } from './item.interface';



const itemSchema = new Schema<IItem>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        specifications: {
            type: [String],
            default: []
        },
        category: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            required: true,
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0,
        },
        available: {
            type: Boolean,
            required: true,
            default: true,
        },
        current_status: {
            type: String,
            enum: Object.values(Current_Status),
            default: Current_Status.AVAILABLE,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        location: {
            type: String,
            required: true
        },
        adv_bookings: {
            type: [
                {
                    startDate: { type: Date, required: true },
                    endDate: { type: Date, required: true }
                }
            ],
            default: []
        }
    }, {
        timestamps: true,
        versionKey: false
    }
);

export const Items = model<IItem>('Items', itemSchema);