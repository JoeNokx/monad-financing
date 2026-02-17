import bcrypt from 'bcryptjs';

export default async function hashPin(pin: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(pin, saltRounds);
}
