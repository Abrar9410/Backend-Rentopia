import { QueryBuilder } from "../../utils/QueryBuilder";
import { itemSearchableFields } from "./item.constant";
import { IItem } from "./item.interface";
import { Items } from "./item.model";


const addItemService = async (payload: Partial<IItem>) => {
    const newItem = await Items.create(payload);
    return newItem;
};

const editItemService = async (itemId: string, payload: Partial<IItem>) => {
    const updatedItem = await Items.findByIdAndUpdate(itemId, payload, { new: true, runValidators: true });
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
    const deletedItem = await Items.findByIdAndDelete(itemId);
    return deletedItem;
};


export const ItemServices = {
    addItemService,
    editItemService,
    getAllItemsService,
    getSingleItemService,
    getMyItemsService,
    removeItemService
};