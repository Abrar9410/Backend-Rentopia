import { JwtPayload } from "jsonwebtoken";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { itemSearchableFields } from "./item.constant";
import { Current_Status, IItem } from "./item.interface";
import { Items } from "./item.model";
import httpStatus from "http-status-codes";
import { Role } from "../user/user.interface";



const addItemService = async (payload: Partial<IItem>) => {
    const newItem = await Items.create(payload);
    return newItem;
};

const editItemService = async (itemId: string, userID: string, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== userID) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item!");
    };

    if (payload.images && payload.images.length > 0 && item.images && item.images.length > 0) {
        payload.images = [...payload.images, ...item.images];
    };

    if (payload.deleteImages && payload.deleteImages.length > 0 && item.images && item.images.length > 0) {

        const restDBImages = item.images.filter(imageUrl => !payload.deleteImages?.includes(imageUrl))

        const updatedPayloadImages = (payload.images || [])
            .filter(imageUrl => !payload.deleteImages?.includes(imageUrl))
            .filter(imageUrl => !restDBImages.includes(imageUrl));

        payload.images = [...restDBImages, ...updatedPayloadImages];
    };

    const updatedItem = await Items.findByIdAndUpdate(itemId, payload, { new: true, runValidators: true });

    if (payload.deleteImages && payload.deleteImages.length > 0 && item.images && item.images.length > 0) {
        await Promise.all(payload.deleteImages.map(url => deleteImageFromCLoudinary(url)))
    };

    return updatedItem;
};

const getAllItemsService = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Items.find(), query)
        .filter()
        .search(itemSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getAllAvailableItemsService = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Items.find({ available: true }), query)
        .filter()
        .search(itemSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getSingleItemService = async (decodedToken: JwtPayload, itemId: string) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "This Item is Not Available!");
    };

    if (item.owner.toString() !== decodedToken.userId && decodedToken.role !== Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to access this item!");
    };

    return item;
};

const getSingleAvailableItemService = async (itemId: string) => {
    const item = await Items.findById(itemId);

    if (!item || !item.available) {
        throw new AppError(httpStatus.NOT_FOUND, "This Item is Not Available!");
    };

    return item;
};

const getMyItemsService = async (ownerId: string) => {
    const items = await Items.find({ owner: ownerId });
    return items;
};

const editItemStatusService = async (user: JwtPayload, itemId: string, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== user.userId && user.role !== Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item!");
    };

    let updatedItem: IItem | null = null;

    if (payload.current_status === Current_Status.FLAGGED || payload.current_status === Current_Status.BLOCKED) {
        if (user.role !== Role.ADMIN) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to set this status!");
        };

        payload.available = false;
    };

    if (payload.current_status === Current_Status.UNDER_MAINTENANCE) {
        payload.available = false;
    };

    updatedItem = await Items.findByIdAndUpdate(itemId, payload, { new: true, runValidators: true });

    return updatedItem;
};

const editItemAvailabilityService = async (userId: string, itemId: string, payload: {available: boolean}) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item!");
    };

    const updatedItem = await Items.findByIdAndUpdate(itemId, payload, { new: true, runValidators: true });

    return updatedItem;
};

const removeItemService = async (itemId: string) => {
    const item = await Items.findById(itemId);
    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.images && item.images.length > 0) {
        await Promise.all(item.images.map(url => deleteImageFromCLoudinary(url)))
    };
    await Items.findByIdAndDelete(itemId);

    return null;
};


export const ItemServices = {
    addItemService,
    editItemService,
    getAllItemsService,
    getAllAvailableItemsService,
    getSingleItemService,
    getSingleAvailableItemService,
    getMyItemsService,
    editItemStatusService,
    editItemAvailabilityService,
    removeItemService
};