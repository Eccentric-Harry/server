import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({
    limit: "1Mb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "1Mb"
}))

app.use(express.static("public"))

app.use(cookieParser())


// Import routers
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js'

// Routes declaration
app.use('/api/v1/users', userRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/subscriptions', subscriptionRoutes);

export { app }