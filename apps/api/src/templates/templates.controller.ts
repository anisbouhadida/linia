import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  ApiDataResponse,
  ApiListResponse,
  ImportTemplateCsvResultDto,
  TemplateDependencyDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
} from '@linia/shared';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CsvImportService } from './csv-import.service';
import {
  CreateTemplateDependencyBody,
  CreateTemplateBody,
  CreateTemplateTaskBody,
  ImportTemplateCsvTextBody,
  UpdateTemplateTaskBody,
} from './templates.dto';
import { TemplatesService } from './templates.service';

/**
 * Authenticated REST controller for template planning and manual task editing.
 *
 * The controller keeps HTTP concerns thin: validation is delegated to DTO classes,
 * business rules live in TemplatesService, and successful resources use the shared
 * `{ data }` or list envelope consumed by the Angular planning screen.
 */
@UseGuards(SessionAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly csvImportService: CsvImportService,
  ) {}

  /**
   * Lists template summaries in most-recently-updated order.
   *
   * @returns List envelope containing template summaries and total count.
   */
  @Get()
  listTemplates(): Promise<ApiListResponse<TemplateSummaryDto>> {
    return this.templatesService.listTemplates();
  }

  /**
   * Creates an empty template shell after request body validation.
   *
   * @param body - Validated template creation request body.
   * @returns Data envelope containing the created template summary.
   */
  @Post()
  async createTemplate(
    @Body() body: CreateTemplateBody,
  ): Promise<ApiDataResponse<TemplateSummaryDto>> {
    return { data: await this.templatesService.createTemplate(body) };
  }

  /**
   * Imports a template and task rows from CSV text sent inside JSON.
   *
   * @param body - Validated CSV import request body.
   * @returns Data envelope containing the imported template summary.
   */
  @Post('import-csv-text')
  async importCsvText(
    @Body() body: ImportTemplateCsvTextBody,
  ): Promise<ApiDataResponse<ImportTemplateCsvResultDto>> {
    return { data: await this.csvImportService.importCsvText(body) };
  }

  /**
   * Returns a template with ordered task definitions and dependency ids.
   *
   * @param id - Template id from the route parameter.
   * @returns Data envelope containing the template detail.
   */
  @Get(':id')
  async getTemplate(
    @Param('id') id: string,
  ): Promise<ApiDataResponse<TemplateDetailDto>> {
    return { data: await this.templatesService.getTemplate(id) };
  }

  /**
   * Appends a task definition to the selected template.
   *
   * @param templateId - Parent template id from the route parameter.
   * @param body - Validated task creation request body.
   * @returns Data envelope containing the created task.
   */
  @Post(':templateId/tasks')
  async createTask(
    @Param('templateId') templateId: string,
    @Body() body: CreateTemplateTaskBody,
  ): Promise<ApiDataResponse<TemplateTaskDto>> {
    return { data: await this.templatesService.createTask(templateId, body) };
  }

  /**
   * Applies a partial task update while keeping the task within its template.
   *
   * @param templateId - Parent template id from the route parameter.
   * @param taskId - Task id from the route parameter.
   * @param body - Validated partial task update body.
   * @returns Data envelope containing the updated task.
   */
  @Patch(':templateId/tasks/:taskId')
  async updateTask(
    @Param('templateId') templateId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTemplateTaskBody,
  ): Promise<ApiDataResponse<TemplateTaskDto>> {
    return {
      data: await this.templatesService.updateTask(templateId, taskId, body),
    };
  }

  /**
   * Creates a dependency edge between two tasks in the selected template.
   *
   * @param templateId - Parent template id from the route parameter.
   * @param body - Validated dependency creation request body.
   * @returns Data envelope containing the created dependency.
   */
  @Post(':templateId/dependencies')
  async createDependency(
    @Param('templateId') templateId: string,
    @Body() body: CreateTemplateDependencyBody,
  ): Promise<ApiDataResponse<TemplateDependencyDto>> {
    return {
      data: await this.templatesService.createDependency(templateId, body),
    };
  }
}
