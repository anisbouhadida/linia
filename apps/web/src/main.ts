import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Boots the standalone Angular application with the shared provider config.
 */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
