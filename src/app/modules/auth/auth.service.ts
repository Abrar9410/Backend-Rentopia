/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Users } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import { IUser } from "../user/user.interface";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { createNewTokensWithRefreshToken, createUserTokens } from "../../utils/userTokens";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { IAuthProvider, IsActive } from "../user/user.interface";
import { sendEmail } from "../../utils/sendEmail";


const credentialsLoginService = async (payload: Partial<IUser>) => {
    const {email, password} = payload;

    const user = await Users.findOne({ email });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
    };

    // const isGoogleAuthenticated = user.auths.some(providerObjects => providerObjects.provider === "google");
    // if (isGoogleAuthenticated && !user.password) {
    //     throw new AppError(
    //         httpStatus.CONFLICT,
    //         "You have authenticated with Google previously! If you want to enable Credentials login, first login with Google with this gmail and set a password for your account."
    //     );
    // };

    const isPasswordMatched = await bcryptjs.compare(password as string, user.password as string);

    if (!isPasswordMatched) {
        throw new AppError(httpStatus.BAD_REQUEST, "Incorrect Password!")
    };

    const { token, refreshToken } = createUserTokens(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password: pass,...rest} = user.toObject();

    return {
        token,
        refreshToken,
        user: rest
    };
};

const getNewTokensService = async (refreshToken: string) => {
    
    const newTokens = await createNewTokensWithRefreshToken(refreshToken);

    return {
        token: newTokens.newToken,
        refreshToken: newTokens.newRefreshToken
    };
};

const changePasswordService = async (decodedToken: JwtPayload, oldPassword: string, newPassword: string) => {
    
    const user = await Users.findById(decodedToken.userId);

    if (user?._id.toString() !== decodedToken.userId) {     //** Not Working Without .toString() */
        throw new AppError(httpStatus.FORBIDDEN, "You are Trying to Change Another User's Password!");
    };

    const isOldPasswordMatched = await bcryptjs.compare(oldPassword, user!.password as string);

    if (!isOldPasswordMatched) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old Password Does Not Match!");
    };

    user!.password = await bcryptjs.hash(newPassword, Number(envVars.SALT));
    await user!.save();
};

const setPasswordService = async (userId: string, plainPassword: string) => {
    const user = await Users.findById(userId);

    if (!user) {    // Not Necessary
        throw new AppError(404, "User not found");
    };

    if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set your password! If you want to change your password, please select change/update password from your profile.")
    };

    const hashedPassword = await bcryptjs.hash(
        plainPassword,
        Number(envVars.SALT)
    );

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email
    };

    const auths: IAuthProvider[] = [...user.auths, credentialProvider];
    user.password = hashedPassword;

    user.auths = auths;

    await user.save();
};

const forgotPasswordService = async (email: string) => {
    const user = await Users.findOne({ email });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
    };

    // if (!user.isVerified) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
    // };

    if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.isActive}!`);
    };

    if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted!");
    };

    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
    };

    const resetToken = jwt.sign(jwtPayload, envVars.JWT_SECRET, {
        expiresIn: "10m"
    });

    const resetUILink = `${envVars.FRONTEND_URL}/reset-password?email=${user.email}&token=${resetToken}`;

    sendEmail({
        to: user.email,
        subject: "Password Reset",
        templateName: "forgotPassword",
        templateData: {
            name: user.name,
            resetUILink
        }
    });
};

const resetPasswordService = async (decodedToken: JwtPayload, payload: Record<string, any>) => {

    const { email, newPassword } = payload;

    if (email != decodedToken.email) {
        throw new AppError(httpStatus.FORBIDDEN, "You can not reset password for another user!");
    };
    
    const user = await Users.findById(decodedToken.userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist!");
    };

    user!.password = await bcryptjs.hash(newPassword, Number(envVars.SALT));
    await user!.save();
};

export const AuthServices = {
    credentialsLoginService,
    getNewTokensService,
    changePasswordService,
    setPasswordService,
    forgotPasswordService,
    resetPasswordService
};