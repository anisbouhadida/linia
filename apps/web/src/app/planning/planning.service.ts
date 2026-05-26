import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  ApiDataResponse,
  ApiListResponse,
  CreateTemplateDto,
  CreateTemplateTaskDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
  UpdateTemplateTaskDto,
} from '@linia/shared';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  constructor(private readonly http: HttpClient) {}

  listTemplates(): Promise<ApiListResponse<TemplateSummaryDto>> {
    return firstValueFrom(
      this.http.get<ApiListResponse<TemplateSummaryDto>>('/templates'),
    );
  }

  async createTemplate(
    template: CreateTemplateDto,
  ): Promise<TemplateSummaryDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<TemplateSummaryDto>>(
        '/templates',
        template,
      ),
    );
    return response.data;
  }

  async getTemplate(templateId: string): Promise<TemplateDetailDto> {
    const response = await firstValueFrom(
      this.http.get<ApiDataResponse<TemplateDetailDto>>(
        `/templates/${templateId}`,
      ),
    );
    return response.data;
  }

  async createTask(
    templateId: string,
    task: CreateTemplateTaskDto,
  ): Promise<TemplateTaskDto> {
    const response = await firstValueFrom(
      this.http.post<ApiDataResponse<TemplateTaskDto>>(
        `/templates/${templateId}/tasks`,
        task,
      ),
    );
    return response.data;
  }

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
