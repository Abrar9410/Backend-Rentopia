import z from "zod";


export const changePasswordZodSchema = z.object({
    oldPassword: z
        .string({ error: "Old Password must be string" })
        .min(1, "Old Password is required."),
    newPassword: z
        .string({ error: "New Password must be string" })
        .min(8, "New Password must be at least 8 characters long.")
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        })
});

export const forgotPasswordZodSchema = z.object({
    email: z.email("Invalid email address."),
});

export const resetPasswordZodSchema = z.object({
    email: z.email("Invalid Email!"),
    newPassword: z
        .string({ error: "Password must be string" })
        .min(8, "Password must be at least 8 characters long.")
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }),
    confirmPassword: z.string("Confirm Password must be string!").min(8, "Passwords did not match!")
})
.refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords did not match!"
});