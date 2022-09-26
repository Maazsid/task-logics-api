import dotenv from 'dotenv';
import express from 'express';
import authRoute from './routes/authRoute';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use('/api/auth', authRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
