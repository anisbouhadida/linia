import { DependencyEngineService } from './dependency-engine.service';

describe('DependencyEngineService', () => {
  const service = new DependencyEngineService();

  it('marks blocked tasks without dependencies as ready', () => {
    expect(
      service.calculateTaskState({
        task: task('task-1', 'BLOCKED'),
        dependencies: [],
      }),
    ).toEqual({
      status: 'READY',
      blockingTaskIds: [],
      canStart: true,
      canComplete: false,
    });
  });

  it('keeps a task blocked while a predecessor is not completed', () => {
    expect(
      service.calculateTaskState({
        task: task('task-2', 'BLOCKED'),
        dependencies: [task('task-1', 'IN_PROGRESS')],
      }),
    ).toEqual({
      status: 'BLOCKED',
      blockingTaskIds: ['task-1'],
      canStart: false,
      canComplete: false,
    });
  });

  it('keeps a task blocked when a predecessor failed', () => {
    expect(
      service.calculateTaskState({
        task: task('task-2', 'BLOCKED'),
        dependencies: [task('task-1', 'FAILED')],
      }),
    ).toEqual({
      status: 'BLOCKED',
      blockingTaskIds: ['task-1'],
      canStart: false,
      canComplete: false,
    });
  });

  it('unlocks a blocked task after all predecessors complete', () => {
    expect(
      service.calculateTaskState({
        task: task('task-3', 'BLOCKED'),
        dependencies: [
          task('task-1', 'COMPLETED'),
          task('task-2', 'COMPLETED'),
        ],
      }),
    ).toEqual({
      status: 'READY',
      blockingTaskIds: [],
      canStart: true,
      canComplete: false,
    });
  });

  it('returns only incomplete predecessors as blockers', () => {
    expect(
      service.calculateTaskState({
        task: task('task-3', 'BLOCKED'),
        dependencies: [
          task('task-1', 'COMPLETED'),
          task('task-2', 'IN_PROGRESS'),
        ],
      }).blockingTaskIds,
    ).toEqual(['task-2']);
  });

  it('reblocks a ready task when a predecessor is no longer completed', () => {
    expect(
      service.calculateTaskState({
        task: task('task-2', 'READY'),
        dependencies: [task('task-1', 'FAILED')],
      }),
    ).toEqual({
      status: 'BLOCKED',
      blockingTaskIds: ['task-1'],
      canStart: false,
      canComplete: false,
    });
  });

  it('preserves in-progress, completed, and failed task statuses', () => {
    expect(
      service.calculateTaskState({
        task: task('task-1', 'IN_PROGRESS'),
        dependencies: [],
      }).status,
    ).toBe('IN_PROGRESS');
    expect(
      service.calculateTaskState({
        task: task('task-1', 'COMPLETED'),
        dependencies: [],
      }).status,
    ).toBe('COMPLETED');
    expect(
      service.calculateTaskState({
        task: task('task-1', 'FAILED'),
        dependencies: [],
      }).status,
    ).toBe('FAILED');
  });

  it('calculates board state and identifies blocking tasks for each task', () => {
    expect(
      service.calculateBoardState([
        { task: task('task-1', 'COMPLETED'), dependsOnTaskIds: [] },
        { task: task('task-2', 'BLOCKED'), dependsOnTaskIds: ['task-1'] },
        { task: task('task-3', 'BLOCKED'), dependsOnTaskIds: ['task-2'] },
      ]),
    ).toEqual([
      {
        taskId: 'task-1',
        status: 'COMPLETED',
        blockingTaskIds: [],
        canStart: false,
        canComplete: false,
      },
      {
        taskId: 'task-2',
        status: 'READY',
        blockingTaskIds: [],
        canStart: true,
        canComplete: false,
      },
      {
        taskId: 'task-3',
        status: 'BLOCKED',
        blockingTaskIds: ['task-2'],
        canStart: false,
        canComplete: false,
      },
    ]);
  });

  it('treats missing board dependency ids as blockers', () => {
    expect(
      service.calculateBoardState([
        { task: task('task-1', 'BLOCKED'), dependsOnTaskIds: ['missing-task'] },
      ]),
    ).toEqual([
      {
        taskId: 'task-1',
        status: 'BLOCKED',
        blockingTaskIds: ['missing-task'],
        canStart: false,
        canComplete: false,
      },
    ]);
  });
});

function task(
  id: string,
  status: Parameters<
    DependencyEngineService['calculateTaskState']
  >[0]['task']['status'],
) {
  return { id, status };
}
