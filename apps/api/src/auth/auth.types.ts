/** User shape stored on authenticated requests and serialized into sessions. */
export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
};

/** Express request shape after Passport session middleware has attached auth helpers. */
export type AuthenticatedRequest = {
  user?: SafeUser;
  isAuthenticated?: () => boolean;
  logout: (callback: (error?: Error) => void) => void;
  session: {
    destroy: (callback: (error?: Error) => void) => void;
  };
};
