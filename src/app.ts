import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { envVars } from "./app/config/env";
import expressSession from "express-session";
import cron from 'node-cron';
import { deleteUnpaidOrdersService, updateStatusAndDeleteOldBookingsOfItems } from "./app/modules/order/order.service";


const app = express();

app.get("/", (req: Request, res: Response) => {
    res.status(200).send({
        message: "Rentopia Backend is Running."
    })
});

app.set("trust proxy", 1);
app.use(cors({
    origin: ['http://localhost:3000', envVars.FRONTEND_URL],
    credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

cron.schedule('* * * * *', async () => {
    try {
        await deleteUnpaidOrdersService();
    } catch (error) {
        if (envVars.NODE_ENV === "development") {
            console.log((error as Error).message);
        };
    };
});

cron.schedule(
    "1 0 * * *",
    async () => {
        try {
            await updateStatusAndDeleteOldBookingsOfItems();
        } catch (error) {
            if (envVars.NODE_ENV === "development") {
                console.log((error as Error).message);
            };
        };
    },
    { timezone: "Asia/Dhaka" }
);


app.use("/api", router);


app.use(globalErrorHandler);

// Not Found Route -- Must be below globalErrorHandler
app.use(notFound);

export default app;