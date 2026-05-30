import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import type {
  ApiListResponse,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
} from '@linia/shared';
import { PlanningPage } from './planning.page';
import { PlanningService } from './planning.service';

describe('PlanningPage', () => {
  let fixture: ComponentFixture<PlanningPage>;
  let planning: {
    listTemplates: ReturnType<typeof vi.fn>;
    createTemplate: ReturnType<typeof vi.fn>;
    importCsvText: ReturnType<typeof vi.fn>;
    getTemplate: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
  };

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

  const dependentTask: TemplateTaskDto = {
    ...task,
    id: 'task-2',
    externalId: 'T-002',
    title: 'Run migration',
    dependsOn: ['task-1'],
  };

  const secondTemplate: TemplateSummaryDto = {
    ...template,
    id: 'template-2',
    name: 'Cutover',
  };

  beforeEach(async () => {
    planning = {
      listTemplates: vi.fn(),
      createTemplate: vi.fn(),
      importCsvText: vi.fn(),
      getTemplate: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
    };
    planning.listTemplates.mockResolvedValue({
      data: [],
      meta: { total: 0, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);

    await TestBed.configureTestingModule({
      imports: [PlanningPage],
      providers: [{ provide: PlanningService, useValue: planning }],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanningPage);
  });

  it('renders an empty state after templates load', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No templates yet');
  });

  it('creates a template and selects it', async () => {
    planning.createTemplate.mockResolvedValue(template);

    fixture.detectChanges();
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector(
      'input[formcontrolname="name"]',
    ) as HTMLInputElement;
    const button = fixture.nativeElement.querySelector(
      '[data-testid="template-form"] button[type="submit"]',
    ) as HTMLButtonElement;

    name.value = 'Core Migration';
    name.dispatchEvent(new Event('input'));
    button.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.createTemplate).toHaveBeenCalledWith({
      name: 'Core Migration',
      description: '',
    });
    expect(fixture.nativeElement.textContent).toContain('Core Migration');
    expect(fixture.nativeElement.textContent).toContain('No tasks yet');
  });

  it('shows template name validation when create is clicked without a name', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="template-form"] button[type="submit"]',
    ) as HTMLButtonElement;
    button.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.createTemplate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Template name is required');
  });

  it('imports CSV text and selects the imported template', async () => {
    planning.importCsvText.mockResolvedValue({
      template: {
        ...template,
        taskCount: 1,
        dependencyCount: 0,
      },
    });
    planning.getTemplate.mockResolvedValue({ ...template, tasks: [task] });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector(
      'input[formcontrolname="importTemplateName"]',
    ) as HTMLInputElement;
    const csv = fixture.nativeElement.querySelector(
      'textarea[formcontrolname="csv"]',
    ) as HTMLTextAreaElement;
    const form = fixture.nativeElement.querySelector(
      '[data-testid="csv-import-form"]',
    ) as HTMLFormElement;

    name.value = 'Core Migration';
    name.dispatchEvent(new Event('input'));
    csv.value = 'externalId,title,dependsOn\nT-001,Check database,';
    csv.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.importCsvText).toHaveBeenCalledWith({
      templateName: 'Core Migration',
      description: '',
      csv: 'externalId,title,dependsOn\nT-001,Check database,',
    });
    expect(planning.getTemplate).toHaveBeenCalledWith('template-1');
    expect(fixture.nativeElement.textContent).toContain('Core Migration');
    expect(
      (fixture.nativeElement.querySelector('tbody input[type="text"]') as HTMLInputElement).value,
    ).toBe('Check database');
  });

  it('loads a selected template with tasks', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate.mockResolvedValue({
      ...template,
      tasks: [task],
    } satisfies TemplateDetailDto);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="select-template"]',
    ) as HTMLButtonElement;
    button.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.getTemplate).toHaveBeenCalledWith('template-1');
    expect(
      (fixture.nativeElement.querySelector('tbody input[type="text"]') as HTMLInputElement).value,
    ).toBe('Check database');
  });

  it('shows dependency labels for locked template tasks', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate.mockResolvedValue({
      ...template,
      tasks: [task, dependentTask],
    } satisfies TemplateDetailDto);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[data-testid="select-template"]') as HTMLButtonElement
    ).click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Depends on T-001');
    expect(fixture.nativeElement.textContent).toContain('Locked');
  });

  it('adds a task to the selected template', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate.mockResolvedValue({ ...template, tasks: [] });
    planning.createTask.mockResolvedValue(task);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[data-testid="select-template"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const externalId = fixture.nativeElement.querySelector(
      'input[formcontrolname="externalId"]',
    ) as HTMLInputElement;
    const title = fixture.nativeElement.querySelector(
      'input[formcontrolname="title"]',
    ) as HTMLInputElement;
    const owner = fixture.nativeElement.querySelector(
      'input[formcontrolname="owner"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector(
      '[data-testid="task-form"]',
    ) as HTMLFormElement;

    externalId.value = 'T-001';
    externalId.dispatchEvent(new Event('input'));
    title.value = 'Check database';
    title.dispatchEvent(new Event('input'));
    owner.value = 'DBA';
    owner.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.createTask).toHaveBeenCalledWith('template-1', {
      externalId: 'T-001',
      title: 'Check database',
      description: '',
      owner: 'DBA',
      estimatedMinutes: undefined,
      requiresEvidence: false,
    });
    expect(
      (fixture.nativeElement.querySelector('tbody input[type="text"]') as HTMLInputElement).value,
    ).toBe('Check database');
  });

  it('shows task validation feedback before creating a task', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate.mockResolvedValue({ ...template, tasks: [] });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[data-testid="select-template"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const minutes = fixture.nativeElement.querySelector(
      'input[formcontrolname="estimatedMinutes"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector(
      '[data-testid="task-form"]',
    ) as HTMLFormElement;

    minutes.value = '-1';
    minutes.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(planning.createTask).not.toHaveBeenCalled();
    expect(text).toContain('External ID is required');
    expect(text).toContain('Task title is required');
    expect(text).toContain('Owner is required');
    expect(text).toContain('Minutes must be zero or greater');
    expect(
      (
        fixture.nativeElement.querySelector(
          'input[formcontrolname="externalId"]',
        ) as HTMLInputElement
      ).classList.contains('is-invalid'),
    ).toBe(true);
  });

  it('clears task validation feedback when another template is selected', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template, secondTemplate],
      meta: { total: 2, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate
      .mockResolvedValueOnce({ ...template, tasks: [] })
      .mockResolvedValueOnce({ ...secondTemplate, tasks: [] });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const templateButtons = fixture.nativeElement.querySelectorAll(
      '[data-testid="select-template"]',
    ) as NodeListOf<HTMLButtonElement>;
    templateButtons[0].click();
    await fixture.whenStable();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[data-testid="task-form"]') as HTMLFormElement
    ).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Owner is required');

    templateButtons[1].click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.getTemplate).toHaveBeenLastCalledWith('template-2');
    expect(fixture.nativeElement.textContent).not.toContain('Owner is required');
    expect(
      (
        fixture.nativeElement.querySelector('input[formcontrolname="owner"]') as HTMLInputElement
      ).classList.contains('is-invalid'),
    ).toBe(false);
  });

  it('shows an error state when templates fail to load', async () => {
    planning.listTemplates.mockRejectedValue(new Error('Network down'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load templates');
  });

  it('shows backend validation details when template creation fails', async () => {
    planning.createTemplate.mockRejectedValue(
      new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Template payload is invalid',
            details: [{ field: 'name', message: 'Name is too long' }],
          },
        },
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector(
      'input[formcontrolname="name"]',
    ) as HTMLInputElement;
    const button = fixture.nativeElement.querySelector(
      '[data-testid="template-form"] button[type="submit"]',
    ) as HTMLButtonElement;

    name.value = 'Core Migration';
    name.dispatchEvent(new Event('input'));
    button.click();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name is too long');
  });

  it('shows backend conflict details when task creation fails', async () => {
    planning.listTemplates.mockResolvedValue({
      data: [template],
      meta: { total: 1, nextCursor: null },
    } satisfies ApiListResponse<TemplateSummaryDto>);
    planning.getTemplate.mockResolvedValue({ ...template, tasks: [] });
    planning.createTask.mockRejectedValue(
      new HttpErrorResponse({
        status: 409,
        error: {
          error: {
            code: 'CONFLICT',
            message: 'Task external ID already exists',
            details: [],
          },
        },
      }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('[data-testid="select-template"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const externalId = fixture.nativeElement.querySelector(
      'input[formcontrolname="externalId"]',
    ) as HTMLInputElement;
    const title = fixture.nativeElement.querySelector(
      'input[formcontrolname="title"]',
    ) as HTMLInputElement;
    const owner = fixture.nativeElement.querySelector(
      'input[formcontrolname="owner"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector(
      '[data-testid="task-form"]',
    ) as HTMLFormElement;

    externalId.value = 'T-001';
    externalId.dispatchEvent(new Event('input'));
    title.value = 'Check database';
    title.dispatchEvent(new Event('input'));
    owner.value = 'DBA';
    owner.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Task external ID already exists');
  });
});
