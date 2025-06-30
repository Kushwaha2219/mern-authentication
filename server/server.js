import express from "express";

import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
const app = express()
const PORT = process.env.PORT ||4000
connectDB();

app.use(express.json())
app.use(cookieParser())
app.use(cors({credentials : true}))
//api Endpoints
app.get('/',(req,res) => res.send("API working"))
app.use('/api/auth', authRouter)
app.use('/api/user', userRoutes);

app.listen(PORT, ()=> console.log(`Server started on PORT : ${PORT}`))