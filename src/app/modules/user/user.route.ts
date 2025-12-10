import { Router } from "express";
import { UserControllers } from "./user.controller";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { validateMutationRequest } from "../../middlewares/validateMutationRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";
import { multerUpload } from "../../config/multer.config";


const router = Router();

router.post("/register", multerUpload.single("file"), validateMutationRequest(createUserZodSchema), UserControllers.createUser);
router.get("/all-users", checkAuth(Role.ADMIN), UserControllers.getAllUsers);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.get("/:id", checkAuth(Role.ADMIN), UserControllers.getSingleUser)
router.patch("/update-user/:id", checkAuth(...Object.values(Role)), multerUpload.single("file"), validateMutationRequest(updateUserZodSchema), UserControllers.updateUser);
router.delete("/delete-user/:id", checkAuth(Role.ADMIN), UserControllers.deleteUser);


export const UserRoutes = router;