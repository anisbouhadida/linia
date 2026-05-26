export type EnvConfig = {
  NODE_ENV: string;
  API_PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  SESSION_STORE_DRIVER: 'memory' | 'postgres';
  SESSION_STORE_DATABASE_URL?: string;
  ADMIN_EMAIL: string;
  ADMIN_INITIAL_PASSWORD: string;
};

const requiredKeys = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_INITIAL_PASSWORD',
] as const;

/**
 * Validates process configuration and applies defaults used by the API.
 *
 * @throws Error when a required variable is empty or API_PORT is outside the valid TCP port range.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const errors: string[] = [];

  const nodeEnv = parseNodeEnv(config.NODE_ENV);
  if (nodeEnv === null) {
    errors.push('NODE_ENV must be development, test, or production');
  }

  for (const key of requiredKeys) {
    if (typeof config[key] !== 'string' || config[key].trim() === '') {
      errors.push(`${key} is required`);
    }
  }

  const apiPort = parsePort(config.API_PORT);
  if (apiPort === null) {
    errors.push('API_PORT must be a valid port number');
  }

  const sessionStoreDriver = parseSessionStoreDriver(
    config.SESSION_STORE_DRIVER,
  );
  if (sessionStoreDriver === null) {
    errors.push('SESSION_STORE_DRIVER must be memory or postgres');
  }

  const sessionStoreDatabaseUrl = parseOptionalString(
    config.SESSION_STORE_DATABASE_URL,
  );
  if (nodeEnv === 'production' && sessionStoreDriver !== 'postgres') {
    errors.push('SESSION_STORE_DRIVER must be postgres in production');
  }
  if (sessionStoreDriver === 'postgres' && !sessionStoreDatabaseUrl) {
    errors.push('SESSION_STORE_DATABASE_URL is required for postgres sessions');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
  }

  return {
    NODE_ENV: nodeEnv ?? 'development',
    API_PORT: apiPort ?? 3000,
    DATABASE_URL: String(config.DATABASE_URL),
    SESSION_SECRET: String(config.SESSION_SECRET),
    SESSION_STORE_DRIVER: sessionStoreDriver ?? 'memory',
    SESSION_STORE_DATABASE_URL: sessionStoreDatabaseUrl,
    ADMIN_EMAIL: String(config.ADMIN_EMAIL),
    ADMIN_INITIAL_PASSWORD: String(config.ADMIN_INITIAL_PASSWORD),
  };
}

function parseNodeEnv(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return 'development';
  }

  if (
    value === 'development' ||
    value === 'test' ||
    value === 'production'
  ) {
    return value;
  }

  return null;
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

function parseSessionStoreDriver(
  value: unknown,
): EnvConfig['SESSION_STORE_DRIVER'] | null {
  if (value === undefined || value === null || value === '') {
    return 'memory';
  }

  if (value === 'memory' || value === 'postgres') {
    return value;
  }

  return null;
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  return value;
}
