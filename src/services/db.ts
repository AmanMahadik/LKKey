import mongoose from 'mongoose';
import dns from 'dns';
import { seedDatabaseIfEmpty } from './seed';

// Configure public DNS servers to bypass local network limits resolving MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Failed to configure custom DNS servers, falling back to system defaults:', err);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aman:aman7120@aman.mmgejlu.mongodb.net/lkkey?retryWrites=true&w=majority';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Run seed routine on connection
    await seedDatabaseIfEmpty();
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

