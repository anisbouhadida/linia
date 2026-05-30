import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

/**
 * Planning module for template and manual template-task management.
 */
@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, CsvImportService],
})
export class TemplatesModule {}
