import { Injectable } from '@nestjs/common';
import type { EntityId, RunTaskStatus } from '@linia/shared';

export interface DependencyEngineTask {
  id: EntityId;
  status: RunTaskStatus;
}

export interface CalculateTaskStateInput {
  task: DependencyEngineTask;
  dependencies: DependencyEngineTask[];
  missingDependencyIds?: EntityId[];
}

export interface CalculatedTaskState {
  status: RunTaskStatus;
  blockingTaskIds: EntityId[];
  canStart: boolean;
  canComplete: boolean;
}

export interface DependencyEngineBoardTask {
  task: DependencyEngineTask;
  dependsOnTaskIds: EntityId[];
}

export interface CalculatedBoardTaskState extends CalculatedTaskState {
  taskId: EntityId;
}

const TERMINAL_OR_ACTIVE_STATUSES = new Set<RunTaskStatus>([
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
]);

/**
 * Calculates server-authoritative run task readiness from dependency state.
 */
@Injectable()
export class DependencyEngineService {
  /**
   * Calculates the effective state and action flags for one run task.
   *
   * @param input - Current task plus direct predecessor tasks.
   * @returns Status, blockers, and action flags for API board DTOs.
   */
  calculateTaskState(input: CalculateTaskStateInput): CalculatedTaskState {
    if (TERMINAL_OR_ACTIVE_STATUSES.has(input.task.status)) {
      return {
        status: input.task.status,
        blockingTaskIds: [],
        canStart: false,
        canComplete: input.task.status === 'IN_PROGRESS',
      };
    }

    const blockingTaskIds = [
      ...(input.missingDependencyIds ?? []),
      ...input.dependencies
        .filter((dependency) => dependency.status !== 'COMPLETED')
        .map((dependency) => dependency.id),
    ];
    const status: RunTaskStatus =
      blockingTaskIds.length === 0 ? 'READY' : 'BLOCKED';

    return {
      status,
      blockingTaskIds,
      canStart: status === 'READY',
      canComplete: false,
    };
  }

  /**
   * Calculates effective state for every task on a run board.
   *
   * @param tasks - Board tasks and direct predecessor ids.
   * @returns Task states in the same order as the input list.
   */
  calculateBoardState(
    tasks: DependencyEngineBoardTask[],
  ): CalculatedBoardTaskState[] {
    const tasksById = new Map(tasks.map(({ task }) => [task.id, task]));

    return tasks.map(({ task, dependsOnTaskIds }) => {
      const dependencies: DependencyEngineTask[] = [];
      const missingDependencyIds: EntityId[] = [];
      for (const dependencyId of dependsOnTaskIds) {
        const dependency = tasksById.get(dependencyId);
        if (dependency) {
          dependencies.push(dependency);
        } else {
          missingDependencyIds.push(dependencyId);
        }
      }

      return {
        taskId: task.id,
        ...this.calculateTaskState({
          task,
          dependencies,
          missingDependencyIds,
        }),
      };
    });
  }
}
