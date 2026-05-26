import * as bcrypt from 'bcrypt';

/** Injection token used to override password comparison in tests. */
export const PASSWORD_COMPARE = Symbol('PASSWORD_COMPARE');

/** Compares a plain password with a stored password hash. */
export type PasswordCompare = (
  plainPassword: string,
  passwordHash: string,
) => Promise<boolean>;

/** bcrypt-backed password comparison implementation used in production. */
export const comparePassword: PasswordCompare = bcrypt.compare;
