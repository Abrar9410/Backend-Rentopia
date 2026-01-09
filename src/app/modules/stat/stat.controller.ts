import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { statServices } from "./stat.service";


const getStatsForAdmin = catchAsync(async (req: Request, res: Response) => {
    
    const result = await statServices.getStatsForAdminService();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Admin Stats Retrieved successfully!",
        data: result,
    });
});

const getStatsForUser = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const result = await statServices.getStatsForUserService(decodedToken.userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User Stats Retrieved successfully!",
        data: result,
    });
});


export const StatControllers = {
    getStatsForAdmin,
    getStatsForUser
};