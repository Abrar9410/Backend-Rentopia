/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { JwtPayload } from "jsonwebtoken";
// import passport from "passport";


const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    // passport.authenticate("local", async (err: any, user: any, info: any) => {

    //     if (err) {
    //         return next(new AppError(err.statusCode || 401, err.message));   // Can't use new AppError() because this is in passport scope
    //     };

    //     if (!user) {
    //         return next(new AppError(httpStatus.NOT_FOUND, info.message)); 
    //     };

    //     const userTokens = createUserTokens(user);

    //     const { password: pass, ...rest } = user.toObject();

    //     setAuthCookie(res, userTokens);

    //     sendResponse(res, {
    //         success: true,
    //         statusCode: httpStatus.OK,
    //         message: "User Logged In Successfully!",
    //         data: {
    //             token: userTokens.token,
    //             refreshToken: userTokens.refreshToken,
    //             user: rest
    //         }
    //     });
    // })(req, res, next)
    
    const loginInfo = await AuthServices.credentialsLoginService(req.body);

    setAuthCookie(res, loginInfo);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully!",
        data: loginInfo
    });
});

const getNewToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError(httpStatus.BAD_REQUEST, "No Refresh Token was received from cookies!")
    };

    const tokenInfo = await AuthServices.getNewTokenService(refreshToken);

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "New Token Received Successfully!",
        data: tokenInfo
    });
});

const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });
    
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged Out Successfully!",
        data: null
    });
});

const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user;
    const oldPassword = req.body.oldPassword || "";
    const newPassword = req.body.newPassword;

    await AuthServices.changePasswordService(decodedToken as JwtPayload, oldPassword, newPassword); 

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Password has been reset Successfully!",
        data: null
    });
});

const setPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user as JwtPayload
    const { password } = req.body;

    await AuthServices.setPasswordService(decodedToken.userId, password); 

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Password has been set Successfully!",
        data: null
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email is required to send password reset link!");
    };

    await AuthServices.forgotPasswordService(email);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Email Sent Successfully! Please check your inbox to reset your password.",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user;

    await AuthServices.resetPasswordService(decodedToken as JwtPayload, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Password has been reset Successfully!",
        data: null
    });
});

// const googleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

//     const user = req.user;
//     if (!user) {
//         throw new AppError(httpStatus.NOT_FOUND, "User Not Found!")
//     };

//     let redirectTo = req.query.state ? req.query.state as string: "";
//     if (redirectTo.startsWith("/")) {
//         redirectTo = redirectTo.slice(1);
//     };

//     const tokenInfo = createUserTokens(user);

//     setAuthCookie(res, tokenInfo);

//     res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`);
// });

export const AuthControllers = {
    credentialsLogin,
    getNewToken,
    logout,
    changePassword,
    resetPassword,
    setPassword,
    forgotPassword,
    // googleCallback
};