import mongoose from "mongoose";

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. The application will not connect to a database.");
    // In a production environment, you might want to throw an error here
    // to prevent the app from starting without a database.
    // For now, we'll allow it to run in a "demo mode" but log a warning.
    return Promise.resolve(mongoose); // callers should check isDbConnected()
  }
  try {
    // Use a fixed dbName per spec
    const connection = await mongoose.connect(uri, { dbName: "vyom" });
    console.log("MongoDB connected successfully.");
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    // Fail-fast: re-throw the error to prevent the app from starting
    throw error; 
  }
}

export function isDbConnected(): boolean {
  // 1 = connected, 2 = connecting; treat 1 as ready
  return mongoose.connection?.readyState === 1;
}