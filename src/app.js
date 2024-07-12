import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

const allowedOrigins = [
  'https://videotube-frontend.vercel.app',
  'http://localhost:5173',
  'https://videotube-rust.vercel.app',
  'http://localhost:5174',
];

// Log allowed origins to verify they are set correctly
console.log('Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('Origin:', origin);
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

const setTokenCookie = (res, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  });
};

const authMiddleware = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // Add token verification logic here
  next();
};

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Validate username and password
  const token = generateToken({ username }); // Generate a JWT or similar token
  setTokenCookie(res, token);
  res.json({ message: 'Logged in successfully' });
});

// Import and use routes
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import likeRouter from './routes/like.routes.js';
import commentRouter from './routes/comment.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import healthRouter from './routes/healthcheck.routes.js';

app.use('/api/v1/users', authMiddleware, userRouter);
app.use('/api/v1/video', authMiddleware, videoRouter);
app.use('/api/v1/like', authMiddleware, likeRouter);
app.use('/api/v1/comment', authMiddleware, commentRouter);
app.use('/api/v1/tweet', authMiddleware, tweetRouter);
app.use('/api/v1/dashboard', authMiddleware, dashboardRouter);
app.use('/api/v1/subscription', authMiddleware, subscriptionRouter);
app.use('/api/v1/playlist', authMiddleware, playlistRouter);
app.use('/api/v1/healthcheck', healthRouter);

export { app };
