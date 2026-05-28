import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginPage } from './auth/login.page';
import { PlanningPage } from './planning/planning.page';

/**
 * MVP route table: anonymous users can log in, authenticated users enter planning.
 */
export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'planning', component: PlanningPage, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'planning' },
  { path: '**', redirectTo: 'planning' },
];
