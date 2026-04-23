export function validateEnv() {
  const required = ['DATABASE_URL'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const recommended = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SOLANA_CLUSTER',
    'NEXT_PUBLIC_SOLANA_RPC',
    'SOLANA_RECIPIENT_ADDRESS',
    'NEXT_PUBLIC_RECLAIM_APP_ID',
    'NEXT_PUBLIC_RECLAIM_APP_SECRET',
    'NEXT_PUBLIC_RECLAIM_PROVIDER_ID',
  ];

  for (const key of recommended) {
    if (!process.env[key]) {
      console.warn(`Warning: Missing recommended environment variable: ${key}`);
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
