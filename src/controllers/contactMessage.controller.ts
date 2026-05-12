import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { ContactMessage } from '../database/models/ContactMessage';

const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_PHONE = 40;
const MAX_MESSAGE = 8000;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body as Record<string, unknown>;

    if (!isNonEmptyString(name) || name.trim().length > MAX_NAME) {
      res.status(400).json({ message: 'Name is required (max 200 characters)' });
      return;
    }
    if (!isNonEmptyString(email) || email.trim().length > MAX_EMAIL) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    const emailNorm = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      res.status(400).json({ message: 'Please enter a valid email address' });
      return;
    }
    if (!isNonEmptyString(message) || message.trim().length > MAX_MESSAGE) {
      res.status(400).json({ message: 'Message is required (max 8000 characters)' });
      return;
    }
    let phoneTrim: string | undefined;
    if (phone != null && String(phone).trim()) {
      phoneTrim = String(phone).trim();
      if (phoneTrim.length > MAX_PHONE) {
        res.status(400).json({ message: 'Phone is too long' });
        return;
      }
    }

    const row = await ContactMessage.create({
      name: name.trim(),
      email: emailNorm,
      phone: phoneTrim,
      message: message.trim(),
    } as any);

    res.status(201).json({
      ok: true,
      id: row.id,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

function toDto(m: ContactMessage) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone ?? undefined,
    message: m.message,
    createdAt: (m as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export const listContactMessages = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await ContactMessage.findAll({
      order: [['createdAt', 'DESC']],
      limit: 500,
    });
    res.json(rows.map((r) => toDto(r)));
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
