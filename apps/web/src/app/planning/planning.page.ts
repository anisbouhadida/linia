import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
} from '@linia/shared';
import { apiErrorMessage } from '../api-error-message';
import { PlanningService } from './planning.service';

@Component({
  selector: 'app-planning-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planning.page.html',
})
export class PlanningPage implements OnInit {
  readonly templates = signal<TemplateSummaryDto[]>([]);
  readonly selectedTemplate = signal<TemplateDetailDto | null>(null);
  readonly loadingTemplates = signal(true);
  readonly loadingTemplate = signal(false);
  readonly templateSubmitting = signal(false);
  readonly taskSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly templateCount = computed(() => this.templates().length);
  readonly selectedTaskCount = computed(
    () => this.selectedTemplate()?.tasks.length ?? 0,
  );

  readonly templateForm;
  readonly taskForm;

  constructor(
    private readonly planningService: PlanningService,
    formBuilder: FormBuilder,
  ) {
    this.templateForm = formBuilder.nonNullable.group({
      name: ['', Validators.required],
      description: [''],
    });
    this.taskForm = formBuilder.nonNullable.group({
      externalId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      owner: [''],
      estimatedMinutes: [''],
      requiresEvidence: [false],
    });
  }

  ngOnInit(): void {
    void this.loadTemplates();
  }

  async loadTemplates(): Promise<void> {
    this.loadingTemplates.set(true);
    this.errorMessage.set(null);

    try {
      const response = await this.planningService.listTemplates();
      this.templates.set(response.data);
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not load templates'));
    } finally {
      this.loadingTemplates.set(false);
    }
  }

  async createTemplate(): Promise<void> {
    if (this.templateForm.invalid || this.templateSubmitting()) {
      this.templateForm.markAllAsTouched();
      return;
    }

    this.templateSubmitting.set(true);
    this.errorMessage.set(null);

    try {
      const template = await this.planningService.createTemplate(
        this.templateForm.getRawValue(),
      );
      this.templates.update((templates) => [template, ...templates]);
      this.selectedTemplate.set({ ...template, tasks: [] });
      this.templateForm.reset({ name: '', description: '' });
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not create template'));
    } finally {
      this.templateSubmitting.set(false);
    }
  }

  async selectTemplate(templateId: string): Promise<void> {
    this.loadingTemplate.set(true);
    this.errorMessage.set(null);

    try {
      this.selectedTemplate.set(await this.planningService.getTemplate(templateId));
    } catch (error) {
      this.errorMessage.set(
        apiErrorMessage(error, 'Could not load template details'),
      );
    } finally {
      this.loadingTemplate.set(false);
    }
  }

  async createTask(): Promise<void> {
    const template = this.selectedTemplate();
    if (!template || this.taskForm.invalid || this.taskSubmitting()) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.taskSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.taskForm.getRawValue();
    const estimatedMinutes = parseOptionalInteger(formValue.estimatedMinutes);

    try {
      const task = await this.planningService.createTask(template.id, {
        externalId: formValue.externalId,
        title: formValue.title,
        description: formValue.description,
        owner: formValue.owner,
        estimatedMinutes,
        requiresEvidence: formValue.requiresEvidence,
      });
      this.appendTask(task);
      this.taskForm.reset({
        externalId: '',
        title: '',
        description: '',
        owner: '',
        estimatedMinutes: '',
        requiresEvidence: false,
      });
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not create task'));
    } finally {
      this.taskSubmitting.set(false);
    }
  }

  async updateTask(
    task: TemplateTaskDto,
    field: 'title' | 'owner' | 'estimatedMinutes' | 'requiresEvidence',
    event: Event,
  ): Promise<void> {
    const template = this.selectedTemplate();
    if (!template) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const value =
      field === 'requiresEvidence'
        ? target.checked
        : field === 'estimatedMinutes'
          ? parseOptionalInteger(target.value)
          : target.value;

    try {
      const updatedTask = await this.planningService.updateTask(
        template.id,
        task.id,
        { [field]: value },
      );
      this.replaceTask(updatedTask);
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not update task'));
    }
  }

  private appendTask(task: TemplateTaskDto): void {
    this.selectedTemplate.update((template) =>
      template ? { ...template, tasks: [...template.tasks, task] } : template,
    );
    this.templates.update((templates) =>
      templates.map((template) =>
        template.id === task.templateId
          ? { ...template, taskCount: template.taskCount + 1 }
          : template,
      ),
    );
  }

  private replaceTask(task: TemplateTaskDto): void {
    this.selectedTemplate.update((template) =>
      template
        ? {
            ...template,
            tasks: template.tasks.map((existingTask) =>
              existingTask.id === task.id ? task : existingTask,
            ),
          }
        : template,
    );
  }
}

function parseOptionalInteger(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
