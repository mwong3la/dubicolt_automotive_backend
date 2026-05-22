import { Response } from 'express';
import { uploadService } from '../services/upload.service';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const result = await uploadService.uploadImage(file!);
  res.status(201).json(result);
});

export const uploadImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    res.status(400).json({
      error: { code: 'validation_error', message: 'No files provided' },
    });
    return;
  }
  const data = await Promise.all(files.map((f) => uploadService.uploadImage(f)));
  res.status(201).json({ data });
});
