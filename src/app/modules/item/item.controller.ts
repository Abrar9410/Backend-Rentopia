import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { ItemServices } from "./item.service";
import { sendResponse } from "../../utils/sendResponse";


const addItem = catchAsync(async (req: Request, res: Response) => {
    const payload = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path),
        owner: req.user?.userId
    };

    const newItem = await ItemServices.addItemService(payload);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Item added successfully!",
        data: newItem
    });
});

const editItem = catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params.id;
    const payload = {
        ...req.body,
        images: (req.files as Express.Multer.File[]).map(file => file.path),
    };

    const updatedItem = await ItemServices.editItemService(itemId, payload);

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

const getSingleItem = catchAsync(async (req: Request, res: Response) => {
    const itemId = req.params.id;

    const item = await ItemServices.getSingleItemService(itemId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Item retrieved successfully!",
        data: item
    });
});

const getMyItems = catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user?.userId as string;

    const items = await ItemServices.getMyItemsService(ownerId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Your Items retrieved successfully!",
        data: items
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
    getSingleItem,
    getMyItems,
    removeItem
};