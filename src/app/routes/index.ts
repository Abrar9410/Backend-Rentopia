import { Router } from "express"
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { ItemRoutes } from "../modules/item/item.route";
import { OrderRoutes } from "../modules/order/order.route";
import { PaymentRoutes } from "../modules/payment/payment.route";

export const router = Router();

const moduleRoutes = [
    {
        path: "/users",
        route: UserRoutes,
    },
    {
        path: "/auth",
        route: AuthRoutes,
    },
    {
        path: "/items",
        route: ItemRoutes,
    },
    {
        path: "/orders",
        route: OrderRoutes,
    },
    {
        path: "/payment",
        route: PaymentRoutes,
    },
];

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
});