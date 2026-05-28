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

/**
 * Planning workspace for creating templates and manually managing their tasks.
 *
 * The component keeps UI state in Angular signals, delegates persistence to
 * PlanningService, and mirrors successful mutations into local state so the
 * dense planning table stays responsive without a full reload after each edit.
 */
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
      owner: ['', Validators.required],
      estimatedMinutes: ['', Validators.min(0)],
      requiresEvidence: [false],
    });
  }

  /**
   * Loads template summaries shown in the planning navigation list.
   */
  ngOnInit(): void {
    void this.loadTemplates();
  }

  /**
   * Refreshes template summaries and stores any API failure as a user-facing message.
   *
   * @returns Resolves after loading state has been cleared.
   */
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

  /**
   * Creates a template from the form and selects it for immediate task entry.
   *
   * @returns Resolves after the submit attempt finishes.
   */
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
      this.resetTaskForm();
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not create template'));
    } finally {
      this.templateSubmitting.set(false);
    }
  }

  /**
   * Loads a template detail record for editing.
   *
   * @param templateId - Template id selected by the operator.
   * @returns Resolves after the selected template state is updated or an error is shown.
   */
  async selectTemplate(templateId: string): Promise<void> {
    this.loadingTemplate.set(true);
    this.errorMessage.set(null);

    try {
      this.selectedTemplate.set(await this.planningService.getTemplate(templateId));
      this.resetTaskForm();
    } catch (error) {
      this.errorMessage.set(
        apiErrorMessage(error, 'Could not load template details'),
      );
    } finally {
      this.loadingTemplate.set(false);
    }
  }

  /**
   * Creates a task from form values, including normalized optional minutes.
   *
   * @returns Resolves after the task submit attempt finishes.
   */
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
      this.resetTaskForm();
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error, 'Could not create task'));
    } finally {
      this.taskSubmitting.set(false);
    }
  }

  /**
   * Persists a single editable task field and replaces the local row on success.
   *
   * @param task - Existing task row being edited.
   * @param field - Editable task field represented by the changed input.
   * @param event - DOM change event from the input control.
   * @returns Resolves after the patch attempt finishes.
   */
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

  /**
   * Adds a task to selected-template state and increments the sidebar count.
   *
   * @param task - Created task returned by the API.
   */
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

  /**
   * Replaces a task row in selected-template state after a successful patch.
   *
   * @param task - Updated task returned by the API.
   */
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

  /**
   * Clears task-entry values and validation display for the selected template.
   */
  private resetTaskForm(): void {
    this.taskForm.reset({
      externalId: '',
      title: '',
      description: '',
      owner: '',
      estimatedMinutes: '',
      requiresEvidence: false,
    });
  }
}

/**
 * Parses optional form input into the API's whole-minute estimate contract.
 *
 * @param value - Raw text from the estimated-minutes form control.
 * @returns A non-negative integer estimate, or undefined when blank or invalid.
 */
function parseOptionalInteger(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
