import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;

    const order = await OrderServices.createOrderService(req.body, decodedToken.userId);
    
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Order created successfully!",
        data: order,
    });
});

const getUserOrders = catchAsync(async (req: Request, res: Response) => {
        const decodedToken = req.user as JwtPayload;
        const orders = await OrderServices.getUserOrdersService(decodedToken.userId, req.query as Record<string, string>);
        
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Orders retrieved successfully!",
            data: orders,
        });
    }
);

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
        const decodedToken = req.user as JwtPayload;
        const orderId = req.params.orderId;
        const order = await OrderServices.getOrderByIdService(decodedToken, orderId);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Order retrieved successfully!",
            data: order,
        });
    }
);

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
        const orders = await OrderServices.getAllOrdersService(req.query as Record<string, string>);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Orders retrieved successfully!",
            data: orders.data,
            meta: orders.meta,
        });
    }
);

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
        const updatedOrder = await OrderServices.updateOrderStatusService(req.params.orderId, req.body);
        
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Order Status Updated Successfully!",
            data: updatedOrder,
        });
    }
);


export const OrderControllers = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    getUserOrders,
    updateOrderStatus,
}