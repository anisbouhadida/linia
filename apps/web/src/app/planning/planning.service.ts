import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  ApiDataResponse,
  ApiListResponse,
  CreateTemplateDto,
  CreateTemplateTaskDto,
  ImportTemplateCsvResultDto,
  ImportTemplateCsvTextDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
  UpdateTemplateTaskDto,
} from '@linia/shared';
import { firstValueFrom } from 'rxjs';

/**
 * HTTP client facade for the planning screen's template and task operations.
 *
 * Methods unwrap single-resource `{ data }` envelopes where convenient while
 * preserving list envelopes because the component also needs pagination metadata.
 */
@Injectable({ providedIn: 'root' })
export class PlanningService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Reads template summaries for the planning sidebar.
   *
   * @returns List envelope containing template summaries and pagination metadata.
   */
  listTemplates(): Promise<ApiListResponse<TemplateSummaryDto>> {
    return firstValueFrom(this.http.get<ApiListResponse<TemplateSummaryDto>>('/templates'));
  }

  /**
   * Creates a template and returns the created summary resource.
   *
   * @param template - Template creation payload from the planning form.
   * @returns Created template summary.
   */
  async createTemplate(template: CreateTemplateDto): Promise<TemplateSummaryDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<TemplateSummaryDto>>('/templates', template),
    );
    return response.data;
  }

  /**
   * Imports a template from CSV text sent as JSON.
   *
   * @param importBody - Template name and raw CSV text from the import form.
   * @returns Imported template summary payload.
   */
  async importCsvText(importBody: ImportTemplateCsvTextDto): Promise<ImportTemplateCsvResultDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<ImportTemplateCsvResultDto>>(
        '/templates/import-csv-text',
        importBody,
      ),
    );
    return response.data;
  }

  /**
   * Loads full template details, including ordered task definitions.
   *
   * @param templateId - Template id selected in the planning UI.
   * @returns Template details including task definitions.
   */
  async getTemplate(templateId: string): Promise<TemplateDetailDto> {
    const response = await firstValueFrom(
      this.http.get<ApiDataResponse<TemplateDetailDto>>(`/templates/${templateId}`),
    );
    return response.data;
  }

  /**
   * Appends a task to the given template.
   *
   * @param templateId - Template id that will own the task.
   * @param task - Task creation payload from the task form.
   * @returns Created template task.
   */
  async createTask(templateId: string, task: CreateTemplateTaskDto): Promise<TemplateTaskDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<TemplateTaskDto>>(`/templates/${templateId}/tasks`, task),
    );
    return response.data;
  }

  /**
   * Applies a partial update to a task within the given template.
   *
   * @param templateId - Template id used to scope the task route.
   * @param taskId - Task id being patched.
   * @param task - Partial update payload for one or more task fields.
   * @returns Updated template task.
   */
  async updateTask(
    templateId: string,
    taskId: string,
    task: UpdateTemplateTaskDto,
  ): Promise<TemplateTaskDto> {
    const response = await firstValueFrom(
      this.http.patch<ApiDataResponse<TemplateTaskDto>>(
        `/templates/${templateId}/tasks/${taskId}`,
        task,
      ),
    );
    return response.data;
  }
}
