import crypto from 'crypto';

export default function generateReference(prefix = 'ref'): string {
  const rand = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${Date.now()}_${rand}`;
}
