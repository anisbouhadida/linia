import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import type { UserDto } from '@linia/shared';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const user: UserDto = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: '2026-05-25T10:00:00.000Z',
  };

  async function runGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      (authGuard as CanActivateFn)({} as never, {
        url: '/planning',
      } as never),
    ) as Promise<boolean | UrlTree>;
  }

  it('allows authenticated users through', async () => {
    const auth = {
      loadCurrentUser: vi.fn().mockResolvedValue(user),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: Router,
          useValue: { parseUrl: vi.fn() },
        },
      ],
    });

    await expect(runGuard()).resolves.toBe(true);
  });

  it('redirects unauthenticated users to login', async () => {
    const loginTree = {} as UrlTree;
    const auth = {
      loadCurrentUser: vi.fn().mockResolvedValue(null),
    };
    const router = {
      parseUrl: vi.fn().mockReturnValue(loginTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    await expect(runGuard()).resolves.toBe(loginTree);
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
  });
});
