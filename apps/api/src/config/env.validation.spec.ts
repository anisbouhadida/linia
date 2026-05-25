import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('returns typed defaults for optional API settings', () => {
    expect(
      validateEnv({
        DATABASE_URL: 'postgresql://linia:linia_password@localhost:5432/linia',
        SESSION_SECRET: 'replace-with-long-random-secret',
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_INITIAL_PASSWORD: 'change-me',
      }),
    ).toMatchObject({
      API_PORT: 3000,
      DATABASE_URL: 'postgresql://linia:linia_password@localhost:5432/linia',
      SESSION_SECRET: 'replace-with-long-random-secret',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_INITIAL_PASSWORD: 'change-me',
    });
  });

  it('rejects invalid required environment values', () => {
    expect(() => validateEnv({})).toThrow(
      'Invalid environment configuration: DATABASE_URL is required, SESSION_SECRET is required, ADMIN_EMAIL is required, ADMIN_INITIAL_PASSWORD is required',
    );
  });
});
