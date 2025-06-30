import express from "express"
import { login, logout, registration, Verification, sendVerifyOtp, sendResetPassword , resetPassword } from "../controllers/authControllers.js";
import authenticateUser from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post('/register', registration)
authRouter.post('/login', login) 
authRouter.post('/logout', logout) 
authRouter.post('/generateOtp',authenticateUser, sendVerifyOtp )
authRouter.post('/verifyOtp',authenticateUser,Verification)
authRouter.post('/send-reset-otp', sendResetPassword) 
authRouter.post('/reset-password', resetPassword)  
export default authRouter