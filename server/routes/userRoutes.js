import express from "express"
import authenticateUser from "../middleware/authMiddleware.js";
import { getUserDetails } from "../controllers/userControllers.js";
const userRoutes = express.Router();

userRoutes.get('/getUserDetails',authenticateUser,getUserDetails) 

export default userRoutes