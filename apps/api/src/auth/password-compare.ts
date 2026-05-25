import * as bcrypt from 'bcrypt';

export const PASSWORD_COMPARE = Symbol('PASSWORD_COMPARE');

export type PasswordCompare = (
  plainPassword: string,
  passwordHash: string,
) => Promise<boolean>;

export const comparePassword: PasswordCompare = bcrypt.compare;
