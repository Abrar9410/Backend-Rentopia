import { Router } from "express";
import { ItemControllers } from "./item.controller";
import { addItemZodSchema, editItemZodSchema } from "./item.validation";
import { validateMutationRequest } from "../../middlewares/validateMutationRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";


const router = Router();

router.post("/add-item", checkAuth(...Object.values(Role)), validateMutationRequest(addItemZodSchema), ItemControllers.addItem);
router.get("/", ItemControllers.getAllAvailableItems);
router.get("/all-items", checkAuth(Role.ADMIN), ItemControllers.getAllItems);
router.get("/my-items", checkAuth(...Object.values(Role)), ItemControllers.getMyItems);
router.get("/all-items/:id", checkAuth(...Object.values(Role)), ItemControllers.getSingleItem);
router.get("/:id", ItemControllers.getSingleAvailableItem);
router.patch("/edit-item/:id", checkAuth(...Object.values(Role)), validateMutationRequest(editItemZodSchema), ItemControllers.editItem);
router.delete("/remove-item/:id", checkAuth(...Object.values(Role)), ItemControllers.removeItem);

export const ItemRoutes = router;