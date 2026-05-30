import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type {
  ApiDataResponse,
  ApiListResponse,
  ImportTemplateCsvResultDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
} from '@linia/shared';
import { PlanningService } from './planning.service';

describe('PlanningService', () => {
  let service: PlanningService;
  let http: HttpTestingController;

  const template: TemplateSummaryDto = {
    id: 'template-1',
    name: 'Core Migration',
    description: null,
    taskCount: 0,
    createdAt: '2026-05-26T10:00:00.000Z',
    updatedAt: '2026-05-26T10:00:00.000Z',
  };

  const task: TemplateTaskDto = {
    id: 'task-1',
    templateId: 'template-1',
    externalId: 'T-001',
    title: 'Check database',
    description: null,
    owner: 'DBA',
    estimatedMinutes: 15,
    orderIndex: 0,
    requiresEvidence: true,
    dependsOn: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PlanningService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads templates from the API', async () => {
    const promise = service.listTemplates();

    const request = http.expectOne('/templates');
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);

    await expect(promise).resolves.toEqual({
      data: [template],
      meta: { total: 1, nextCursor: null },
    });
  });

  it('creates a template', async () => {
    const promise = service.createTemplate({
      name: 'Core Migration',
      description: 'Launch checklist',
    });

    const request = http.expectOne('/templates');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Core Migration',
      description: 'Launch checklist',
    });
    request.flush({ data: template } satisfies ApiDataResponse<TemplateSummaryDto>);

    await expect(promise).resolves.toEqual(template);
  });

  it('loads template details', async () => {
    const detail: TemplateDetailDto = { ...template, tasks: [task] };
    const promise = service.getTemplate('template-1');

    const request = http.expectOne('/templates/template-1');
    expect(request.request.method).toBe('GET');
    request.flush({ data: detail } satisfies ApiDataResponse<TemplateDetailDto>);

    await expect(promise).resolves.toEqual(detail);
  });

  it('creates a task for a template', async () => {
    const promise = service.createTask('template-1', {
      externalId: 'T-001',
      title: 'Check database',
      requiresEvidence: true,
    });

    const request = http.expectOne('/templates/template-1/tasks');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      externalId: 'T-001',
      title: 'Check database',
      requiresEvidence: true,
    });
    request.flush({ data: task } satisfies ApiDataResponse<TemplateTaskDto>);

    await expect(promise).resolves.toEqual(task);
  });

  it('imports a template from CSV text', async () => {
    const result: ImportTemplateCsvResultDto = {
      template: {
        ...template,
        taskCount: 2,
        dependencyCount: 1,
      },
    };
    const promise = service.importCsvText({
      templateName: 'Core Migration',
      csv: 'externalId,title,dependsOn\nT-001,Check database,',
    });

    const request = http.expectOne('/templates/import-csv-text');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      templateName: 'Core Migration',
      csv: 'externalId,title,dependsOn\nT-001,Check database,',
    });
    request.flush({ data: result } satisfies ApiDataResponse<ImportTemplateCsvResultDto>);

    await expect(promise).resolves.toEqual(result);
  });
});
