import dotenv from 'dotenv';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import authRoute from './routes/authRoute';
import passport from 'passport';
import { otpStragety } from './utils/passport-strageties/otpStragety';
import cookieParser from 'cookie-parser';
import swaggerDocument from './swagger/swagger-output.json';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.disable('x-powered-by');

app.use(express.json());
app.use(cookieParser());

app.use(helmet());

passport.use('otpStragety', otpStragety);

if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use('/api/auth', authRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
