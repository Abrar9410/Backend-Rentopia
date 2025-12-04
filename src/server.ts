import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";

let server: Server;

const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL);

        if (envVars.NODE_ENV === "development") {
            console.log("Connected to Database!");
        };

        server = app.listen(envVars.PORT, () => {
            if (envVars.NODE_ENV === "development") {
                console.log("Server is running on port", envVars.PORT);
            };
        });
    } catch (error) {
        if (envVars.NODE_ENV === "development") {
            console.log(error);
        };
    }
};

startServer();


// SIGTERM Error
process.on("SIGTERM", () => {
    if (envVars.NODE_ENV === "development") {
        console.log("SIGTERM signal received! Server shutting down...");
    };

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    };

    process.exit(1);
});


// Unhandled Rejection Error
process.on("unhandledRejection", (error) => {
    if (envVars.NODE_ENV === "development") {
        console.log("Unhandled Rejection detected! Server shutting down...", error);
    };

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    };

    process.exit(1);
});


// Uncaught Exception Error
process.on("uncaughtException", (error) => {
    if (envVars.NODE_ENV === "development") {
        console.log("Uncaught Exception detected! Server shutting down...", error);
    };

    if (server) {
        server.close(() => {
            process.exit(1);
        });
    };

    process.exit(1);
});