import dotenv from 'dotenv';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import authRoute from './routes/authRoute';
import passport from 'passport';
import { otpStragety } from './utils/passport-strageties/otpStragety';
import cookieParser from 'cookie-parser';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cookieParser());

passport.use('otpStragety', otpStragety);

app.use('/api/auth', authRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

