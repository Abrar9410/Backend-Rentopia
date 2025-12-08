import { z } from "zod";
import { ORDER_STATUS } from "./order.interface";

export const createOrderZodSchema = z.object({
    item: z.string().min(1, "Item ID is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
});

export const updateOrderStatusZodSchema = z.object({
    status: z.enum(Object.values(ORDER_STATUS) as [string]),
});