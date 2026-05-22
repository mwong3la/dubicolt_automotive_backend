import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validateLogin, validateRegister } from '../validators/auth.validator';
import type { AuthRequest } from '../middlewares/auth.middleware';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validateLogin(req.body ?? {});
  const result = await authService.login(email, password);
  res.json(result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = validateRegister(req.body ?? {});
  const result = await authService.register(data);
  res.status(201).json(result);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).send();
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await authService.me(req.user!));
});
