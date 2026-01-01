import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { ItemServices } from "./item.service";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";


const addItem = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const payload = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path),
        owner: req.user?.userId
    };

    const newItem = await ItemServices.addItemService(decodedToken.userId, payload);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Item added successfully!",
        data: newItem
    });
});

const editItem = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const itemId = req.params.id;
    const payload = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path),
    };

    const updatedItem = await ItemServices.editItemService(itemId, decodedToken.userId, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item updated successfully!",
        data: updatedItem
    });
});

const getAllItems = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await ItemServices.getAllItemsService(query as Record<string, string>);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Items retrieved successfully!",
        data: result.data,
        meta: result.meta
    });
});

const getAllAvailableItems = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    const result = await ItemServices.getAllItemsService(query as Record<string, string>);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All Available Items retrieved successfully!",
        data: result.data,
        meta: result.meta
    });
});

const getSingleItem = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const itemId = req.params.id;

    const item = await ItemServices.getSingleItemService(decodedToken ,itemId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item retrieved successfully!",
        data: item
    });
});

const getSingleAvailableItem = catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params.id;

    const item = await ItemServices.getSingleAvailableItemService(itemId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item retrieved successfully!",
        data: item
    });
});

const getMyItems = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const ownerId = req.user?.userId as string;

    const result = await ItemServices.getMyItemsService(query as Record<string, string>, ownerId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Your Items retrieved successfully!",
        data: result.data,
        meta: result.meta
    });
});

const editItemStatus = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const itemId = req.params.id;
    const { current_status } = req.body;

    const updatedItem = await ItemServices.editItemStatusService(decodedToken, itemId, { current_status });
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item status updated successfully!",
        data: updatedItem
    });
});

const editItemAvailability = catchAsync(async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const itemId = req.params.id;
    const { available } = req.body;

    const updatedItem = await ItemServices.editItemAvailabilityService(decodedToken.userId, itemId, { available });
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item status updated successfully!",
        data: updatedItem
    });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params.id;
    
    await ItemServices.removeItemService(itemId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item deleted successfully!",
        data: null
    });
});



export const ItemControllers = {
    addItem,
    editItem,
    getAllItems,
    getAllAvailableItems,
    getSingleItem,
    getSingleAvailableItem,
    getMyItems,
    editItemStatus,
    editItemAvailability,
    removeItem
};