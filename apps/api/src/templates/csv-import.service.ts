import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type {
  ApiErrorCode,
  ImportTemplateCsvResultDto,
  ImportTemplateCsvTextDto,
} from '@linia/shared';
import { PrismaService } from '../database/prisma.service';

interface CsvTaskRow {
  externalId: string;
  title: string;
  description: string | null;
  owner: string | null;
  estimatedMinutes: number | null;
  requiresEvidence: boolean;
  dependsOn: string | null;
  orderIndex: number;
}

interface CreatedTaskRef {
  id: string;
  externalId: string;
}

const REQUIRED_HEADERS = ['externalId', 'title', 'dependsOn'] as const;

/**
 * Imports planning templates from CSV text sent in JSON.
 */
@Injectable()
export class CsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses, validates, and persists a template import in one transaction.
   *
   * @param input - CSV import body from the planning API.
   * @returns Summary of the imported template.
   */
  async importCsvText(
    input: ImportTemplateCsvTextDto,
  ): Promise<ImportTemplateCsvResultDto> {
    const templateName = requiredText(input.templateName, 'templateName');
    const description = optionalText(input.description);
    const rows = parseImportRows(input.csv);

    return this.prisma.$transaction(async (tx) => {
      const template = await tx.template.create({
        data: { name: templateName, description },
      });

      const createdTasks = await tx.templateTask.createManyAndReturn({
        data: rows.map((row) => ({
          templateId: template.id,
          externalId: row.externalId,
          title: row.title,
          description: row.description,
          owner: row.owner,
          estimatedMinutes: row.estimatedMinutes,
          requiresEvidence: row.requiresEvidence,
          orderIndex: row.orderIndex,
        })),
        select: { id: true, externalId: true },
      });
      const taskIdsByExternalId = new Map(
        createdTasks.map((task: CreatedTaskRef) => [task.externalId, task.id]),
      );
      const dependencyRows = rows.flatMap((row) => {
        if (!row.dependsOn) {
          return [];
        }

        return [
          {
            templateId: template.id,
            taskId: taskIdsByExternalId.get(row.externalId)!,
            dependsOnTaskId: taskIdsByExternalId.get(row.dependsOn)!,
          },
        ];
      });

      if (dependencyRows.length > 0) {
        await tx.templateDependency.createMany({ data: dependencyRows });
      }

      return {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          taskCount: rows.length,
          dependencyCount: dependencyRows.length,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
        },
      };
    });
  }
}

function parseImportRows(csv: string): CsvTaskRow[] {
  const records = parseCsv(csv);
  if (records.length === 0) {
    throwCsvError('EMPTY_CSV', 'CSV content is empty');
  }

  const headers = records[0].map((header) => header.trim());
  const headerIndexes = new Map(
    headers.map((header, index) => [header, index]),
  );
  const missingHeader = REQUIRED_HEADERS.find(
    (header) => !headerIndexes.has(header),
  );
  if (missingHeader) {
    throwCsvError('INVALID_CSV_HEADER', `Missing CSV column: ${missingHeader}`);
  }

  const taskRows = records
    .slice(1)
    .filter((record) => record.some((value) => value.trim() !== ''));
  if (taskRows.length === 0) {
    throwCsvError('EMPTY_CSV', 'CSV content has no task rows');
  }

  const rows = taskRows.map((record, index) =>
    toTaskRow(record, headerIndexes, index),
  );
  validateExternalIds(rows);
  validateDependencies(rows);

  return rows;
}

function toTaskRow(
  record: string[],
  headerIndexes: Map<string, number>,
  orderIndex: number,
): CsvTaskRow {
  const externalId = requiredText(
    csvValue(record, headerIndexes, 'externalId'),
    'externalId',
  );
  const title = requiredText(csvValue(record, headerIndexes, 'title'), 'title');
  const dependsOn = optionalText(csvValue(record, headerIndexes, 'dependsOn'));

  return {
    externalId,
    title,
    description: optionalText(csvValue(record, headerIndexes, 'description')),
    owner: optionalText(csvValue(record, headerIndexes, 'owner')),
    estimatedMinutes: optionalInteger(
      csvValue(record, headerIndexes, 'estimatedMinutes'),
    ),
    requiresEvidence: optionalBoolean(
      csvValue(record, headerIndexes, 'requiresEvidence'),
    ),
    dependsOn,
    orderIndex,
  };
}

function csvValue(
  record: string[],
  headerIndexes: Map<string, number>,
  header: string,
): string | undefined {
  const index = headerIndexes.get(header);
  return index === undefined ? undefined : record[index];
}

function validateExternalIds(rows: CsvTaskRow[]): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.externalId)) {
      throwCsvError(
        'DUPLICATE_EXTERNAL_ID',
        `Duplicate externalId: ${row.externalId}`,
        'externalId',
      );
    }
    seen.add(row.externalId);
  }
}

function validateDependencies(rows: CsvTaskRow[]): void {
  const externalIds = new Set(rows.map((row) => row.externalId));
  for (const row of rows) {
    if (row.dependsOn && !externalIds.has(row.dependsOn)) {
      throwCsvError(
        'UNKNOWN_DEPENDENCY_REFERENCE',
        `Unknown dependsOn reference: ${row.dependsOn}`,
        'dependsOn',
      );
    }
  }
}

function parseCsv(csv: string): string[][] {
  const trimmed = csv.trim();
  if (!trimmed) {
    return [];
  }

  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    const next = trimmed[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      record.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      continue;
    }

    field += char;
  }

  record.push(field);
  records.push(record);
  return records;
}

function requiredText(value: string | undefined, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throwCsvError('VALIDATION_ERROR', `${field} is required`, field);
  }

  return trimmed;
}

function optionalText(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

function optionalInteger(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throwCsvError(
      'VALIDATION_ERROR',
      'estimatedMinutes must be a positive integer',
      'estimatedMinutes',
    );
  }

  return parsed;
}

function optionalBoolean(value: string | undefined): boolean {
  const trimmed = value?.trim().toLowerCase() ?? '';
  if (!trimmed) {
    return false;
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  throwCsvError(
    'VALIDATION_ERROR',
    'requiresEvidence must be true or false',
    'requiresEvidence',
  );
}

function throwCsvError(
  code: ApiErrorCode,
  message: string,
  field?: string,
): never {
  throw new UnprocessableEntityException({
    code,
    message,
    details: [{ field, message }],
  });
}
