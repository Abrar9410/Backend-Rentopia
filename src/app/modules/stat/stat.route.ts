import { Router } from "express";
import { StatControllers } from "./stat.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";



const router = Router();


router.get("/admin", checkAuth(Role.ADMIN), StatControllers.getStatsForAdmin);
router.get("/user", checkAuth(Role.USER), StatControllers.getStatsForUser);


export const StatRoutes = router;