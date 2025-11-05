import { Request } from 'express';

// Augment the Express Request type to include Multer's file property
declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
    }
  }
}