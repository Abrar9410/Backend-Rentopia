import { Router } from "express";
import { PaymentControllers } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";


const router = Router();


router.post("/init-payment/:orderId", checkAuth(...Object.values(Role)), PaymentControllers.initPayment);
router.post("/success", PaymentControllers.successPayment);
router.post("/fail", PaymentControllers.failPayment);
router.post("/cancel", PaymentControllers.cancelPayment);
router.post("/validate-payment", PaymentControllers.validatePayment); // Must be a "Post" method
router.get("/invoice/:paymentId", checkAuth(...Object.values(Role)), PaymentControllers.getInvoiceDownloadUrl);
router.get("/:transactionId", checkAuth(...Object.values(Role)), PaymentControllers.getPaymentByTransactionId);


export const PaymentRoutes = router;