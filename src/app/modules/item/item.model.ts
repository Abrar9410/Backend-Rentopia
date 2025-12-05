import { Schema, model } from 'mongoose';
import { Availability, IItem } from './item.interface';



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
        category: {
            type: String,
            required: true,
        },
        pricePerDay: {
            type: Number,
            required: true,
            min: 0,
        },
        availability: {
            type: String,
            enum: Object.values(Availability),
            default: Availability.AVAILABLE,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    }, {
        timestamps: true,
        versionKey: false
    }
);

export const Items = model<IItem>('Items', itemSchema);