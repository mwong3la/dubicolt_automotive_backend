import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'not_found', 'Route not found');
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }
  console.error(err);
  sendError(res, 500, 'internal_error', 'An unexpected error occurred');
}
