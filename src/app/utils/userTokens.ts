import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import { IUser } from "../modules/user/user.interface";
import { generateToken, verifyToken } from "./jwt";
import { Users } from "../modules/user/user.model";
import AppError from "../errorHelpers/AppError";
import httpStatus from "http-status-codes";

export const createUserTokens = (user: Partial<IUser>) => {
    const jwtPayload = { userId: user._id, name: user.name, email: user.email, picture: user.picture };

    const token = generateToken(jwtPayload, envVars.JWT_SECRET, envVars.JWT_EXPIRESIN);

    const refreshToken = generateToken(jwtPayload, envVars.REFRESH_JWT_SECRET, envVars.REFRESH_JWT_EXPIRESIN);

    return {
        token,
        refreshToken
    };
};

export const createNewTokenWithRefreshToken = async (refreshToken: string) => {
    const verifiedRefreshToken = verifyToken(refreshToken, envVars.REFRESH_JWT_SECRET) as JwtPayload;

    const user = await Users.findOne({ email: verifiedRefreshToken.email });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Does Not Exist!");
    };

    const jwtPayload = {
        userId: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
    };

    const newToken = generateToken(jwtPayload, envVars.JWT_SECRET, envVars.JWT_EXPIRESIN);

    return newToken;
};