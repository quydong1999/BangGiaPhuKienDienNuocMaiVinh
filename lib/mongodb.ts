import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Vui lòng định nghĩa biến MONGODB_URI trong file .env.local');
}

/**
 * MongoDB Singleton để duy trì kết nối duy nhất (đặc biệt quan trọng trong Next.js Dev mode).
 */
class MongoDB {
  private static instance: MongoDB;
  private conn: any = null;
  private promise: any = null;

  private constructor() {
    // Khởi tạo cached từ global để giữ kết nối qua các lần Hot Reload
    const cached = (global as any).mongoose;
    if (cached) {
      this.conn = cached.conn;
      this.promise = cached.promise;
    } else {
      (global as any).mongoose = { conn: null, promise: null };
    }
  }

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  public async connect() {
    if (this.conn) {
      return this.conn;
    }

    if (!this.promise) {
      const opts = {
        bufferCommands: false,
      };

      this.promise = mongoose.connect(MONGODB_URI!, opts)
        .then((mongoose) => {
          console.log('✅ MongoDB đã kết nối thành công');
          return mongoose;
        })
        .catch((e) => {
          console.error('❌ Lỗi kết nối MongoDB:', e.message);
          this.promise = null;
          (global as any).mongoose.promise = null;
          throw e;
        });
      
      (global as any).mongoose.promise = this.promise;
    }

    try {
      this.conn = await this.promise;
      (global as any).mongoose.conn = this.conn;
    } catch (e) {
      this.conn = null;
      (global as any).mongoose.conn = null;
      throw e;
    }

    return this.conn;
  }
}

export const connectDB = () => MongoDB.getInstance().connect();