import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { UserDto } from '@linia/shared';
import { Component, signal } from '@angular/core';
import { App } from './app';
import { AuthService } from './auth/auth.service';

@Component({
  template: '',
})
class EmptyRouteComponent {}

describe('App', () => {
  const user: UserDto = {
    id: 'user-1',
    email: 'admin@example.com',
    displayName: 'Admin',
    createdAt: '2026-05-25T10:00:00.000Z',
  };
  let auth: {
    currentUser: ReturnType<typeof signal<UserDto | null>>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      currentUser: signal<UserDto | null>(null),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'login', component: EmptyRouteComponent }]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the Linia shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-brand')?.textContent).toContain(
      'Linia',
    );
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('logs out authenticated users from the shell', async () => {
    auth.currentUser.set(user);
    auth.logout.mockResolvedValue(undefined);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect(auth.logout).toHaveBeenCalled();
  });
});
