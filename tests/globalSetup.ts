export default async (): Promise<void> => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/omade_cravings_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
};