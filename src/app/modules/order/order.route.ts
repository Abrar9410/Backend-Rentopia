import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateMutationRequest } from "../../middlewares/validateMutationRequest";
import { Role } from "../user/user.interface";
import { OrderControllers } from "./order.controller";
import { createOrderZodSchema, updateOrderStatusZodSchema } from "./order.validation";

const router = Router();

router.post("/",
    checkAuth(...Object.values(Role)),
    validateMutationRequest(createOrderZodSchema),
    OrderControllers.createOrder
);

router.get("/",
    checkAuth(Role.ADMIN),
    OrderControllers.getAllOrders
);

router.get("/my-orders",
    checkAuth(...Object.values(Role)),
    OrderControllers.getMyOrders
);

router.get("/customer-orders",
    checkAuth(...Object.values(Role)),
    OrderControllers.getCustomerOrders
);

router.get("/:orderId",
    checkAuth(...Object.values(Role)),
    OrderControllers.getSingleOrder
);

router.patch("/:orderId/status",
    checkAuth(...Object.values(Role)),
    validateMutationRequest(updateOrderStatusZodSchema),
    OrderControllers.updateOrderStatus
);

export const OrderRoutes = router;