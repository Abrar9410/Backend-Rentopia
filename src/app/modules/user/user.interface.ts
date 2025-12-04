import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    USER = "USER",
};

export interface IAuthProvider {
    provider: "google" | "credentials";   //"Google", "Credential"
    providerId: string
};

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
};

export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    phone: string;
    picture?: string;
    address: string;
    isDeleted?: boolean;
    isActive?: IsActive;
    isVerified?: boolean;
    role: Role;
    auths: IAuthProvider[];
    createdAt?: Date;
};