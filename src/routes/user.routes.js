import { Router } from "express";
import {    changeCurrentPassword, 
            getCurrentUser, 
            loginUser, 
            logoutUser, 
            refreshAccessToken, 
            registerUser, 
            updateAccountDetails, 
            updateAvatar, 
            updateCoverImage, 
            getUserChannelProfile,
            getWatchHistory 
        } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]) ,registerUser)

router.route("/login").post(loginUser)

// secured Routes
router.route("/logout").post( verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar )
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage )
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)



export default router