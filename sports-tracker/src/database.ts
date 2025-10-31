import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/sports?authSource=admin';
    
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    
    if (mongoose.connection.db) {
      console.log(`Database: ${mongoose.connection.db.databaseName}`);
    }
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}