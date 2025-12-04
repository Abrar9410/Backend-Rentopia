import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
    PORT: string;
    DB_URL: string;
    NODE_ENV: "development" | "production";
    SALT: string;
    JWT_SECRET: string;
    JWT_EXPIRESIN: string;
    REFRESH_JWT_SECRET: string;
    REFRESH_JWT_EXPIRESIN: string;
    // SUPER_ADMIN_EMAIL: string;
    // SUPER_ADMIN_PASSWORD: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    EXPRESS_SESSION_SECRET: string;
    FRONTEND_URL: string;
    SSL: {
        STORE_ID: string,
        STORE_PASS: string,
        SSL_PAYMENT_API: string,
        SSL_VALIDATION_API: string,
        SSL_IPN_URL: string,
        SSL_SUCCESS_BACKEND_URL: string,
        SSL_FAIL_BACKEND_URL: string,
        SSL_CANCEL_BACKEND_URL: string,
        SSL_SUCCESS_FRONTEND_URL: string,
        SSL_FAIL_FRONTEND_URL: string,
        SSL_CANCEL_FRONTEND_URL: string,
    };
    CLOUDINARY: {
        CLOUDINARY_CLOUD_NAME: string,
        CLOUDINARY_API_SECRET: string,
        CLOUDINARY_API_KEY: string
    };
    EMAIL_SENDER: {
        SMTP_HOST: string,
        SMTP_PORT: string,
        SMTP_USER: string,
        SMTP_PASS: string,
        SMTP_FROM: string
    };
    REDIS: {
        REDIS_HOST: string,
        REDIS_PORT: string,
        REDIS_USERNAME: string,
        REDIS_PASSWORD: string
    };
};

const loadEnvVariables = (): EnvConfig => {

    const requiredEnvVariables: string[] = [
        "PORT",
        "DB_URL",
        "NODE_ENV",
        "SALT",
        "JWT_SECRET",
        "JWT_EXPIRESIN",
        "REFRESH_JWT_SECRET",
        "REFRESH_JWT_EXPIRESIN",
        // "SUPER_ADMIN_EMAIL",
        // "SUPER_ADMIN_PASSWORD",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_CALLBACK_URL",
        "EXPRESS_SESSION_SECRET",
        "FRONTEND_URL",
        "SSL_STORE_ID",
        "SSL_STORE_PASS",
        "SSL_PAYMENT_API",
        "SSL_VALIDATION_API",
        "SSL_IPN_URL",
        "SSL_SUCCESS_BACKEND_URL",
        "SSL_FAIL_BACKEND_URL",
        "SSL_CANCEL_BACKEND_URL",
        "SSL_SUCCESS_FRONTEND_URL",
        "SSL_FAIL_FRONTEND_URL",
        "SSL_CANCEL_FRONTEND_URL",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_SECRET",
        "CLOUDINARY_API_KEY",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_FROM",
        "REDIS_HOST",
        "REDIS_PORT",
        "REDIS_USERNAME",
        "REDIS_PASSWORD"
    ];

    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable ${key}`)
        }
    });

    return {
        PORT: process.env.PORT as string,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as "development" | "production",
        SALT: process.env.SALT as string,
        JWT_SECRET: process.env.JWT_SECRET as string,
        JWT_EXPIRESIN: process.env.JWT_EXPIRESIN as string,
        REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET as string,
        REFRESH_JWT_EXPIRESIN: process.env.REFRESH_JWT_EXPIRESIN as string,
        // SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
        // SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
        EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string,
        // ssl
        SSL: {
            STORE_ID: process.env.SSL_STORE_ID as string,
            STORE_PASS: process.env.SSL_STORE_PASS as string,
            SSL_PAYMENT_API: process.env.SSL_PAYMENT_API as string,
            SSL_VALIDATION_API: process.env.SSL_VALIDATION_API as string,
            SSL_IPN_URL: process.env.SSL_IPN_URL as string,
            SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL as string,
            SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL as string,
            SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL as string,
            SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL as string,
            SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL as string,
            SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL as string,
        },
        // cloudinary
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string
        },
        // Email Sender
        EMAIL_SENDER: {
            SMTP_HOST: process.env.SMTP_HOST as string,
            SMTP_PORT: process.env.SMTP_PORT as string,
            SMTP_USER: process.env.SMTP_USER as string,
            SMTP_PASS: process.env.SMTP_PASS as string,
            SMTP_FROM: process.env.SMTP_FROM as string
        },
        // REDIS
        REDIS: {
            REDIS_HOST: process.env.REDIS_HOST as string,
            REDIS_PORT: process.env.REDIS_PORT as string,
            REDIS_USERNAME: process.env.REDIS_USERNAME as string,
            REDIS_PASSWORD: process.env.REDIS_PASSWORD as string
        }
    };
}

export const envVars = loadEnvVariables();