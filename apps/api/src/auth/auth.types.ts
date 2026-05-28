/**
 * User shape allowed to leave the authentication boundary.
 *
 * Password hashes and other credential material must never be added here.
 */
export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
};

/**
 * Express request shape after Passport session middleware has attached auth helpers.
 */
export type AuthenticatedRequest = {
  user?: SafeUser;
  isAuthenticated?: () => boolean;
  logout: (callback: (error?: Error) => void) => void;
  session: {
    destroy: (callback: (error?: Error) => void) => void;
  };
};
