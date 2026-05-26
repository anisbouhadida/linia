import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  beforeEach(async () => {
    planning = {
      listTemplates: vi.fn(),
      createTemplate: vi.fn(),
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
    expect(fixture.nativeElement.textContent).toContain(
      'Template name is required',
    );
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
      (fixture.nativeElement.querySelector(
        'tbody input[type="text"]',
      ) as HTMLInputElement).value,
    ).toBe('Check database');
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
      fixture.nativeElement.querySelector(
        '[data-testid="select-template"]',
      ) as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const externalId = fixture.nativeElement.querySelector(
      'input[formcontrolname="externalId"]',
    ) as HTMLInputElement;
    const title = fixture.nativeElement.querySelector(
      'input[formcontrolname="title"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector(
      '[data-testid="task-form"]',
    ) as HTMLFormElement;

    externalId.value = 'T-001';
    externalId.dispatchEvent(new Event('input'));
    title.value = 'Check database';
    title.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(planning.createTask).toHaveBeenCalledWith('template-1', {
      externalId: 'T-001',
      title: 'Check database',
      description: '',
      owner: '',
      estimatedMinutes: undefined,
      requiresEvidence: false,
    });
    expect(
      (fixture.nativeElement.querySelector(
        'tbody input[type="text"]',
      ) as HTMLInputElement).value,
    ).toBe('Check database');
  });

  it('shows an error state when templates fail to load', async () => {
    planning.listTemplates.mockRejectedValue(new Error('Network down'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Could not load templates',
    );
  });
});
