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
  TemplateDetailDto,
  TemplateSummaryDto,
  TemplateTaskDto,
} from '@linia/shared';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateTemplateBody,
  CreateTemplateTaskBody,
  UpdateTemplateTaskBody,
} from './templates.dto';
import { TemplatesService } from './templates.service';

@UseGuards(SessionAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  listTemplates(): Promise<ApiListResponse<TemplateSummaryDto>> {
    return this.templatesService.listTemplates();
  }

  @Post()
  async createTemplate(
    @Body() body: CreateTemplateBody,
  ): Promise<ApiDataResponse<TemplateSummaryDto>> {
    return { data: await this.templatesService.createTemplate(body) };
  }

  @Get(':id')
  async getTemplate(
    @Param('id') id: string,
  ): Promise<ApiDataResponse<TemplateDetailDto>> {
    return { data: await this.templatesService.getTemplate(id) };
  }

  @Post(':templateId/tasks')
  async createTask(
    @Param('templateId') templateId: string,
    @Body() body: CreateTemplateTaskBody,
  ): Promise<ApiDataResponse<TemplateTaskDto>> {
    return { data: await this.templatesService.createTask(templateId, body) };
  }

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
}
