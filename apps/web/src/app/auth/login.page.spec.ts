import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import type { UserDto } from '@linia/shared';
import { AuthService } from './auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  const user: UserDto = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: '2026-05-25T10:00:00.000Z',
  };

  beforeEach(async () => {
    auth = { login: vi.fn() };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('submits credentials and navigates to planning after login', async () => {
    auth.login.mockResolvedValue(user);

    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'admin@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'change-me';
    password.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'change-me',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning');
  });

  it('shows an error when login fails', async () => {
    auth.login.mockRejectedValue(new Error('Unauthorized'));

    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'admin@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'wrong-password';
    password.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Invalid email or password',
    );
  });

  it('shows Bootstrap validation feedback when password is missing', () => {
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(password.classList.contains('is-invalid')).toBe(true);
    expect(password.getAttribute('aria-describedby')).toBe('password-feedback');
    expect(fixture.nativeElement.textContent).toContain('Password is required');
  });

  it('shows Bootstrap validation feedback when email is malformed', () => {
    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input'));
    password.value = 'change-me';
    password.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(email.classList.contains('is-invalid')).toBe(true);
    expect(email.getAttribute('aria-describedby')).toBe('email-feedback');
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid email address',
    );
  });

  it('keeps the generic invalid-credentials message for 401 login failures', async () => {
    auth.login.mockRejectedValue(
      new HttpErrorResponse({
        status: 401,
        error: {
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Session expired',
            details: [],
          },
        },
      }),
    );

    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'admin@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'change-me';
    password.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid email or password');
    expect(fixture.nativeElement.textContent).not.toContain('Session expired');
  });

  it('shows backend validation details when login payload is rejected', async () => {
    auth.login.mockRejectedValue(
      new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Login payload is invalid',
            details: [{ field: 'email', message: 'Email must be valid' }],
          },
        },
      }),
    );

    const email = fixture.nativeElement.querySelector(
      'input[type="email"]',
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'admin@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'change-me';
    password.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Email must be valid',
    );
  });
});
