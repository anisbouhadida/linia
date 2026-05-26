import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import type { ApiDataResponse, UserDto } from '@linia/shared';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const user: UserDto = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: '2026-05-25T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the current user into auth state', async () => {
    const promise = service.loadCurrentUser();

    const request = http.expectOne('/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush({ data: user } satisfies ApiDataResponse<UserDto>);

    await expect(promise).resolves.toEqual(user);
    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears auth state when the current user request is unauthenticated', async () => {
    service.setCurrentUser(user);

    const promise = service.loadCurrentUser();

    const request = http.expectOne('/auth/me');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).resolves.toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logs in and stores the returned user', async () => {
    const promise = service.login({
      email: 'admin@example.com',
      password: 'change-me',
    });

    const request = http.expectOne('/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'admin@example.com',
      password: 'change-me',
    });
    request.flush({ data: user } satisfies ApiDataResponse<UserDto>);

    await expect(promise).resolves.toEqual(user);
    expect(service.currentUser()).toEqual(user);
  });

  it('logs out and clears the current user', async () => {
    service.setCurrentUser(user);

    const promise = service.logout();

    const request = http.expectOne('/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(promise).resolves.toBeUndefined();
    expect(service.currentUser()).toBeNull();
  });
});
