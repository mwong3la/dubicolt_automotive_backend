"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContactMessages = exports.createContactMessage = void 0;
const ContactMessage_1 = require("../database/models/ContactMessage");
const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_PHONE = 40;
const MAX_MESSAGE = 8000;
function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}
const createContactMessage = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
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
        let phoneTrim;
        if (phone != null && String(phone).trim()) {
            phoneTrim = String(phone).trim();
            if (phoneTrim.length > MAX_PHONE) {
                res.status(400).json({ message: 'Phone is too long' });
                return;
            }
        }
        const row = await ContactMessage_1.ContactMessage.create({
            name: name.trim(),
            email: emailNorm,
            phone: phoneTrim,
            message: message.trim(),
        });
        res.status(201).json({
            ok: true,
            id: row.id,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createContactMessage = createContactMessage;
function toDto(m) {
    return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone ?? undefined,
        message: m.message,
        createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
    };
}
const listContactMessages = async (_req, res) => {
    try {
        const rows = await ContactMessage_1.ContactMessage.findAll({
            order: [['createdAt', 'DESC']],
            limit: 500,
        });
        res.json(rows.map((r) => toDto(r)));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listContactMessages = listContactMessages;
