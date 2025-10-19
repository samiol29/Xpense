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

// Use in-memory MongoDB for development (MongoDB Atlas has SSL issues)
console.log('Using in-memory MongoDB for development');
const mem = await MongoMemoryServer.create();
const mongoUri = mem.getUri();
console.log('Using in-memory MongoDB at', mongoUri);

await mongoose.connect(mongoUri);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


