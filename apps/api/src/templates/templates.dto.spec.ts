import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateTemplateTaskBody } from './templates.dto';

describe('CreateTemplateTaskBody', () => {
  it('accepts create task input without an order index', async () => {
    const body = Object.assign(new CreateTemplateTaskBody(), {
      externalId: 'T-001',
      title: 'Check database',
      requiresEvidence: false,
    });

    await expect(validate(body)).resolves.toHaveLength(0);
  });
});
