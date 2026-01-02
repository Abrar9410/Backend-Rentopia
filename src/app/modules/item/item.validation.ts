import { z } from "zod";
import { Category, Current_Status } from "./item.interface";


export const addItemZodSchema = z.object({
    title: z
        .string({ error: "Item name must be string" })
        .min(1, "Item name is required"),
    description: z
        .string({ error: "Description must be string" })
        .min(1, "Description is required"),
    specifications: z
        .array(z.string({ error: "Each specification must be string" }), {
            error: "Specifications must be an array of strings"
        })
        .optional(),
    category: z
        .enum(Object.values(Category) as [string], { error: "Invalid category" }),
    location: z
        .string({ error: "Pick-Up Location must be string"})
        .min(1, "Location is required!"),
    pricePerDay: z
        .number({ error: "Price must be number" })
        .positive("Price must be greater than 0"),
    available: z
        .boolean({ error: "The property 'Available' must be boolean" })
        .optional(),
    current_status: z
        .enum(Object.values(Current_Status) as [string], { error: "Invalid Current-Status!" })
        .optional(),
});

export const editItemZodSchema = z.object({
    title: z
        .string({ error: "Item name must be string" })
        .min(1, "Item name is required")
        .optional(),
    description: z
        .string({ error: "Description must be string" })
        .min(1, "Description is required")
        .optional(),
    specifications: z
        .array(z.string({ error: "Each specification must be string" }), {
            error: "Specifications must be an array of strings" })
        .optional(),
    category: z
        .enum(Object.values(Category) as [string], { error: "Invalid category" })
        .optional(),
    location: z
        .string({ error: "Pick-Up Location must be string" })
        .min(1, "Location is required!")
        .optional,
    pricePerDay: z
        .number({ error: "Price must be number" })
        .positive("Price must be greater than 0")
        .optional(),
    available: z
        .boolean({ error: "The property 'Available' must be boolean" })
        .optional(),
    deleteImages: z.array(z.string()).optional()
});

export const editItemStatusZodSchema = z.object({
    current_status: z.enum(Object.values(Current_Status) as [string], { error: "Invalid Current-Status!" }),
});

export const editItemAvailabilityZodSchema = z.object({
    available: z.boolean({ error: "The property 'Available' must be boolean" }),
});