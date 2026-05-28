import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { authErrorMessage } from '../api-error-message';
import { AuthService } from './auth.service';

/**
 * Login screen for the seeded operator account.
 *
 * The page owns form validation and submission state, while AuthService owns
 * session synchronization and API communication.
 */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  protected readonly form = new FormGroup({
    email: new FormControl('admin@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  /**
   * Authenticates the submitted credentials and enters the protected planning area.
   *
   * @returns Resolves after the submit attempt finishes and navigation occurs on success.
   */
  async submit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl('/planning');
    } catch (error) {
      this.errorMessage.set(authErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
