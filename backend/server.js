import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import txRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budget.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txRoutes);
app.use('/api/budget', budgetRoutes);

let mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  const mem = await MongoMemoryServer.create();
  mongoUri = mem.getUri();
  console.log('Using in-memory MongoDB at', mongoUri);
}

// Connection options to fix SSL issues
const options = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  retryWrites: true,
  w: 'majority'
};

await mongoose.connect(mongoUri, options);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


