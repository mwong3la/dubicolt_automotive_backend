import { Response } from 'express';
import { AppError } from '../errors/AppError';

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
): void {
  res.status(status).json({
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export function sendValidationError(
  res: Response,
  details: Record<string, string[]>,
  message = 'Validation failed',
): void {
  sendError(res, 400, 'validation_error', message, details);
}

export function handleControllerError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }
  console.error(err);
  sendError(res, 500, 'internal_error', 'An unexpected error occurred');
}
