import { Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
// import passport from "passport";
// import { envVars } from "../../config/env";


const router = Router();

router.post("/login", AuthControllers.credentialsLogin);
router.post("/refresh-token", AuthControllers.getNewToken);
router.post("/logout", AuthControllers.logout);
router.post("/change-password", checkAuth(...Object.values(Role)), AuthControllers.changePassword);
router.post("/set-password", checkAuth(...Object.values(Role)), AuthControllers.setPassword);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.post("/reset-password", checkAuth(...Object.values(Role)), AuthControllers.resetPassword);

// router.get("/google", (req: Request, res: Response, next: NextFunction) => {
//     const redirect = req.query.redirect || "/";
//     passport.authenticate("google", {scope: ["profile", "email"], state: redirect as string})(req, res, next);
// });  // Using GET method because we don't have to send any Body through Request

// router.get(
//     "/google/callback",
//     passport.authenticate(
//         "google",
//         {failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is an issue with your account. Please contact our support team.`}
//     ),
//     AuthControllers.googleCallback
// );

export const AuthRoutes = router;