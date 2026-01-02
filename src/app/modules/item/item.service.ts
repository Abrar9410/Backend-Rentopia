import { JwtPayload } from "jsonwebtoken";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { itemSearchableFields } from "./item.constant";
import { Current_Status, IItem } from "./item.interface";
import { Items } from "./item.model";
import httpStatus from "http-status-codes";
import { Role } from "../user/user.interface";



const addItemService = async (decodedToken: JwtPayload, payload: Partial<IItem>) => {
    const newItem = await Items.create({
        ...payload,
        owner: decodedToken.userId,
        ownerRole: decodedToken.role
    });

    return newItem;
};

const editRentopiaItemService = async (itemId: string, decodedToken: JwtPayload, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.ownerRole !== decodedToken.role) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to edit this item!");
    };

    if (payload.images && payload.images.length > 0 && item.images && item.images.length > 0) {
        payload.images = [...item.images, ...payload.images];
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

const editItemService = async (itemId: string, userID: string, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== userID) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item!");
    };

    if (payload.images && payload.images.length > 0 && item.images && item.images.length > 0) {
        payload.images = [...item.images, ...payload.images];
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
        queryBuilder.build().populate("owner", "name email picture role"),
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
        queryBuilder.build().populate("owner", "name email picture role"),
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

const getRentopiaItemsService = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Items.find({ ownerRole: Role.ADMIN }), query)
        .filter()
        .search(itemSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build().populate("owner", "name email picture"),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getMyItemsService = async (query: Record<string, string>, ownerId: string) => {
    const queryBuilder = new QueryBuilder(Items.find({ owner: ownerId }), query)
        .filter()
        .search(itemSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build().populate("owner", "name picture"),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const editItemStatusService = async (user: JwtPayload, itemId: string, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== user.userId && user.role !== Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to update this item!");
    };

    if (item.current_status === Current_Status.FLAGGED || item.current_status === Current_Status.BLOCKED) {
        if (user.role !== Role.ADMIN) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                `Sorry, you cannot change Status of a ${item.current_status} item. Please contact us first.`
            );
        };
    };

    if (payload.current_status === Current_Status.FLAGGED || payload.current_status === Current_Status.BLOCKED) {
        if (user.role !== Role.ADMIN) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to set this status!");
        };

        payload.available = false;
    };

    if (payload.current_status === Current_Status.UNDER_MAINTENANCE) {
        payload.available = false;
    };

    const updatedItem = await Items.findByIdAndUpdate(itemId, payload, { new: true, runValidators: true });

    return updatedItem;
};

const editItemAvailabilityService = async (decodedToken: JwtPayload, itemId: string, payload: {available: boolean}) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
    };

    if (item.owner.toString() !== decodedToken.userId) {
        if (item.ownerRole !== Role.ADMIN || decodedToken.role !== Role.ADMIN) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                "Sorry! You cannot enlist or withdraw this item as you are not the owner."
            );
        };
    };

    if (payload.available === true) {
        if (
            item.current_status === Current_Status.UNDER_MAINTENANCE ||
            item.current_status === Current_Status.FLAGGED ||
            item.current_status === Current_Status.BLOCKED
        ) {
            throw new AppError(
                httpStatus.FORBIDDEN,
                `This Item cannot be given on rent as it is currently ${item.current_status}`
            );
        };
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
    editRentopiaItemService,
    editItemService,
    getAllItemsService,
    getAllAvailableItemsService,
    getSingleItemService,
    getSingleAvailableItemService,
    getRentopiaItemsService,
    getMyItemsService,
    editItemStatusService,
    editItemAvailabilityService,
    removeItemService
};