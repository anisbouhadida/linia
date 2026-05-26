import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import type { ApiDataResponse, UserDto } from '@linia/shared';
import { firstValueFrom } from 'rxjs';

export type LoginCredentials = {
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<UserDto | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor(private readonly http: HttpClient) {}

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

  async login(credentials: LoginCredentials): Promise<UserDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<UserDto>>('/auth/login', credentials),
    );
    this.user.set(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/auth/logout', null));
    this.user.set(null);
  }

  setCurrentUser(user: UserDto | null): void {
    this.user.set(user);
  }
}

function isUnauthenticated(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
