import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { itemSearchableFields } from "./item.constant";
import { IItem } from "./item.interface";
import { Items } from "./item.model";
import httpStatus from "http-status-codes";



const addItemService = async (payload: Partial<IItem>) => {
    const newItem = await Items.create(payload);
    return newItem;
};

const editItemService = async (itemId: string, payload: Partial<IItem>) => {
    const item = await Items.findById(itemId);

    if (!item) {
        throw new AppError(httpStatus.NOT_FOUND, "Item not found!");
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

const getSingleItemService = async (itemId: string) => {
    const item = await Items.findById(itemId);
    return item;
};

const getMyItemsService = async (ownerId: string) => {
    const items = await Items.find({ owner: ownerId });
    return items;
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
    getSingleItemService,
    getMyItemsService,
    removeItemService
};