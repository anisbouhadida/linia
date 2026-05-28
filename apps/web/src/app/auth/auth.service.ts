import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import type { ApiDataResponse, UserDto } from '@linia/shared';
import { firstValueFrom } from 'rxjs';

/**
 * Credentials submitted to the API local-login endpoint.
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Client-side authentication facade for session-backed API auth.
 *
 * The browser session remains authoritative on the backend; this service mirrors
 * the resolved user in Angular signals so guards, layout, and pages can react to
 * login/logout changes.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<UserDto | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private readonly http: HttpClient) {}

  /**
   * Loads the current session user and synchronizes the local auth signal.
   *
   * @returns The current user, or null when the API reports an unauthenticated session.
   */
  async loadCurrentUser(): Promise<UserDto | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiDataResponse<UserDto>>('/auth/me'),
      );
      this.user.set(response.data);
      return response.data;
    } catch (error) {
      if (isUnauthenticated(error)) {
        this.user.set(null);
        return null;
      }

      throw error;
    }
  }

  /**
   * Authenticates with the API and stores the returned user in local auth state.
   *
   * @param credentials - Email and password entered on the login page.
   * @returns The authenticated user returned by the API.
   */
  async login(credentials: LoginCredentials): Promise<UserDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<UserDto>>('/auth/login', credentials),
    );
    this.user.set(response.data);
    return response.data;
  }

  /**
   * Ends the API session and clears local auth state after the request succeeds.
   *
   * @returns Resolves after the logout request completes.
   */
  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/auth/logout', null));
    this.user.set(null);
  }

  /**
   * Replaces local auth state with a user resolved outside this service.
   *
   * @param user - Current user to expose through auth signals, or null to clear.
   */
  setCurrentUser(user: UserDto | null): void {
    this.user.set(user);
  }
}

/**
 * Detects the unauthenticated response used by the session guard.
 *
 * @param error - Unknown error thrown by Angular HttpClient.
 * @returns True when the API reported HTTP 401.
 */
function isUnauthenticated(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
