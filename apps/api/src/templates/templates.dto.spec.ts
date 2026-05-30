import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  CreateTemplateDependencyBody,
  CreateTemplateTaskBody,
  ImportTemplateCsvTextBody,
} from './templates.dto';

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

describe('ImportTemplateCsvTextBody', () => {
  it('accepts a CSV text import payload', async () => {
    const body = Object.assign(new ImportTemplateCsvTextBody(), {
      templateName: 'Core Migration',
      csv: 'externalId,title,dependsOn\nT-001,Check database,',
    });

    await expect(validate(body)).resolves.toHaveLength(0);
  });

  it('rejects missing CSV text', async () => {
    const body = Object.assign(new ImportTemplateCsvTextBody(), {
      templateName: 'Core Migration',
    });

    await expect(validate(body)).resolves.not.toHaveLength(0);
  });
});

describe('CreateTemplateDependencyBody', () => {
  it('accepts dependency task ids', async () => {
    const body = Object.assign(new CreateTemplateDependencyBody(), {
      taskId: 'task-2',
      dependsOnTaskId: 'task-1',
    });

    await expect(validate(body)).resolves.toHaveLength(0);
  });

  it('rejects missing dependency task ids', async () => {
    const body = new CreateTemplateDependencyBody();

    await expect(validate(body)).resolves.not.toHaveLength(0);
  });
});
