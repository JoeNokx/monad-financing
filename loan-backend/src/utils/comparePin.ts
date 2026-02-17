import bcrypt from 'bcryptjs';

export default async function comparePin(pin: string, hashedPin: string): Promise<boolean> {
  return bcrypt.compare(pin, hashedPin);
}
