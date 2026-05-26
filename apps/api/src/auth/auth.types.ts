export type SafeUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
};

export type AuthenticatedRequest = {
  user?: SafeUser;
  isAuthenticated?: () => boolean;
  logout: (callback: (error?: Error) => void) => void;
};
