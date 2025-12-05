import { Types } from "mongoose";

enum Category {
    ELECTRONICS = "ELECTRONICS",
    FURNITURE = "FURNITURE",
    TOOLS = "TOOLS",
    SPORTS = "SPORTS",
    HOME_APPLIANCES = "HOME_APPLIANCES",
    BOOKS = "BOOKS",
    OTHERS = "OTHERS"
};

export enum Availability {
    AVAILABLE = "AVAILABLE",
    RENTED = "RENTED",
    UNAVAILABLE = "UNAVAILABLE"
};

export interface IItem {
    _id?: Types.ObjectId;
    title: string;
    description: string;
    category: Category;
    pricePerDay: number;
    availability: Availability;
    owner: Types.ObjectId;
    images: string[];
    // location: string;
    createdAt?: Date;
    updatedAt?: Date;
};