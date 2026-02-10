export function validateEnv() {
  const required = ['MONGO_URI', 'MONGO_DB_NAME'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}
