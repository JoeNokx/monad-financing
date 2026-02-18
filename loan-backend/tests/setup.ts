process.env.NODE_ENV = 'test';

// Prevent accidental runtime failures if something touches Prisma during tests.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
}

if (!process.env.PORT) {
  process.env.PORT = '4000';
}
