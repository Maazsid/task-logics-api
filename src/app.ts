import dotenv from 'dotenv';
import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import passport from 'passport';
import { otpStragety } from './utils/passport-strageties/otpStragety';
import cookieParser from 'cookie-parser';
import swaggerDocument from './swagger/swagger-output.json';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import routes from './routes/index';

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

app.use('/', routes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
