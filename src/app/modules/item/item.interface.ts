import { Types } from "mongoose";
import { Role } from "../user/user.interface";

export enum Category {
    ELECTRONICS = "Electronics",
    FURNITURE = "Furniture",
    TOOLS = "Tools",
    SPORTS = "Sports",
    HOME_APPLIANCES = "Home Appliances",
    BOOKS = "Books",
    VEHICLES = "Vehicles",
    GAMES = "Games",
    OTHERS = "Others"
};

export enum Current_Status {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
    FLAGGED = "FLAGGED",
    BLOCKED = "BLOCKED"
};

export interface Adv_Booking {
    startDate: Date | string;
    endDate: Date | string;
};

export interface IItem {
    _id?: Types.ObjectId;
    title: string;
    description: string;
    specifications?: string[];
    category: Category;
    images: string[];
    pricePerDay: number;
    available: boolean;
    current_status: Current_Status;
    owner: Types.ObjectId;
    ownerRole: Role;
    location: string;
    adv_bookings: Adv_Booking[] | [];
    createdAt?: Date;
    updatedAt?: Date;
    deleteImages?: string[];
};