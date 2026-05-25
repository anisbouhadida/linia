export type EnvConfig = {
  API_PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_INITIAL_PASSWORD: string;
};

const requiredKeys = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_INITIAL_PASSWORD',
] as const;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const errors: string[] = [];

  for (const key of requiredKeys) {
    if (typeof config[key] !== 'string' || config[key].trim() === '') {
      errors.push(`${key} is required`);
    }
  }

  const apiPort = parsePort(config.API_PORT);
  if (apiPort === null) {
    errors.push('API_PORT must be a valid port number');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
  }

  return {
    API_PORT: apiPort ?? 3000,
    DATABASE_URL: String(config.DATABASE_URL),
    SESSION_SECRET: String(config.SESSION_SECRET),
    ADMIN_EMAIL: String(config.ADMIN_EMAIL),
    ADMIN_INITIAL_PASSWORD: String(config.ADMIN_INITIAL_PASSWORD),
  };
}

function parsePort(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return 3000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return port;
}
