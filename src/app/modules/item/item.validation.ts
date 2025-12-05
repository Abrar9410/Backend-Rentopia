import { z } from "zod";
import { Availability, Category } from "./item.interface";

export const addItemZodSchema = z.object({
    title: z
        .string({ error: "Item name must be string" })
        .min(1, "Item name is required"),
    description: z
        .string({ error: "Description must be string" })
        .min(1, "Description is required"),
    category: z
        .enum(Object.values(Category) as [string], { error: "Invalid category" }),
    pricePerDay: z
        .number({ error: "Price must be number" })
        .positive("Price must be greater than 0"),
    availability: z
        .enum(Object.values(Availability) as [string], { error: "Invalid availability status" })
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
    category: z
        .enum(Object.values(Category) as [string], { error: "Invalid category" })
        .optional(),
    pricePerDay: z
        .number({ error: "Price must be number" })
        .positive("Price must be greater than 0")
        .optional(),
    availability: z
        .enum(Object.values(Availability) as [string], { error: "Invalid availability status" })
        .optional(),
});