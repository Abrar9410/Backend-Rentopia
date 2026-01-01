import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { Users } from "./user.model";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";


const createUserService = async (payload: Partial<IUser>) => {
    const { email, password, ...rest } = payload;

    const user = await Users.findOne({email});

    if (user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exists!");
    };

    const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.SALT))

    const authProvider: IAuthProvider = {provider: "credentials", providerId: email as string};

    const newUser = await Users.create({
        email,
        password: hashedPassword,
        auths: [authProvider],
        ...rest
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pwd, ...createdUser } = newUser.toObject();

    return createdUser;
};

const updateUserService = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {
    /**
     * email - cannot be updated -> already taken care of using zod schema
     * name, phone, address, password
     * password re-hashing
     * Only ADMIN can update -> role, isDeleted, isActive: BLOCKED/INACTIVE, isVerified
     */

    if (decodedToken.role === Role.USER) {
        if (userId !== decodedToken.userId) {
            throw new AppError(httpStatus.FORBIDDEN, "You are Unauthorized to Update another user's Profile!");
        };
    };

    const user = await Users.findById(userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found!");
    };


    // if (user.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
    //     throw new AppError(httpStatus.FORBIDDEN, "You are Not Authorized to Update this Profile!");
    // };

    if (payload.role) {
        if (decodedToken.role === Role.USER) {
            throw new AppError(httpStatus.FORBIDDEN, "You are Not authorized to update role!");
        };

        // if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
        //     throw new AppError(httpStatus.FORBIDDEN, "You are Not authorized to promote anyone to SUPER_ADMIN!");
        // };
    };

    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === Role.USER) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this property(s)!");
        };
    };

    if (payload.password) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Password Can Not be Updated on this Route! If You Want to Change Your Password then Go to '/reset-password' Route");
    };

    if (payload.deleteImage && payload.deleteImage === user.picture) {
        await deleteImageFromCLoudinary(user.picture as string);
        if (!payload.picture) {
            payload.picture = "";
        };
    };

    const updatedUser = await Users.findByIdAndUpdate(userId, payload, {new: true, runValidators: true});

    return updatedUser;
}

const getAllUsersService = async (query: Record<string, string>) => {

    const queryBuilder = new QueryBuilder(Users.find(), query)
    const usersData = queryBuilder
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getMeService = async (userId: string) => {
    const user = await Users.findById(userId).select("-password");
    
    return user;
};

const getSingleUserService = async (id: string) => {
    const user = await Users.findById(id).select("-password");

    return {
        data: user
    };
};

const deleteUserService = async (userId: string) => {
    const user = await Users.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found!");
    };
    return null;
};

export const UserServices = {
    createUserService,
    updateUserService,
    getAllUsersService,
    getMeService,
    getSingleUserService,
    deleteUserService
};