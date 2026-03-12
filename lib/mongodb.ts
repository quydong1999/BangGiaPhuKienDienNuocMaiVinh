import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Vui lòng định nghĩa biến MONGODB_URI trong file .env.local');
}

/** * Sử dụng biến Global để duy trì kết nối khi Next.js Hot Reload (trong môi trường Dev)
 * Tránh việc tạo quá nhiều kết nối gây quá tải MongoDB Atlas.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // 1. Nếu đã có kết nối trước đó, dùng lại luôn
  if (cached.conn) {
    return cached.conn;
  }

  // 2. Nếu chưa có kết nối, tiến hành tạo mới và CATCH LỖI
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Không đợi lệnh nếu chưa kết nối xong (tránh treo request)
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB đã kết nối thành công');
        return mongoose;
      })
      .catch((e) => {
        console.error('❌ Lỗi kết nối MongoDB:', e.message);
        cached.promise = null; // Reset promise để lần sau có thể thử lại
        throw e; // Ném lỗi ra ngoài để API Route xử lý
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.conn = null;
    throw e;
  }

  return cached.conn;
};