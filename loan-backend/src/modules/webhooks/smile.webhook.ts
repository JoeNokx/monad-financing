import type { RequestHandler } from 'express';

export const handleSmileWebhook: RequestHandler = async (_req, res) => {
  res.status(200).json({ success: true });
};
