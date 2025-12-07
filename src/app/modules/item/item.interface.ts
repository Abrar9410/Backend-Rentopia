import { Types } from "mongoose";

export enum Category {
    ELECTRONICS = "ELECTRONICS",
    FURNITURE = "FURNITURE",
    TOOLS = "TOOLS",
    SPORTS = "SPORTS",
    HOME_APPLIANCES = "HOME_APPLIANCES",
    BOOKS = "BOOKS",
    OTHERS = "OTHERS"
};

export enum Current_Status {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED"
};

export interface Adv_Booking {
    startDate: Date;
    endDate: Date;
};

export interface IItem {
    _id?: Types.ObjectId;
    title: string;
    description: string;
    category: Category;
    images: string[];
    pricePerDay: number;
    available: boolean;
    current_status: Current_Status;
    owner: Types.ObjectId;
    location: string;
    adv_bookings: Adv_Booking[] | [];
    createdAt?: Date;
    updatedAt?: Date;
    deleteImages?: string[];
};