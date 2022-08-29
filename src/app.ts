import dotenv = require('dotenv');
import express = require('express');

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
