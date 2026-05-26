import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: {
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns liveness status', () => {
      expect(appController.getLive()).toEqual({ data: { status: 'ok' } });
    });

    it('returns readiness status after checking the database', async () => {
      await expect(appController.getReady()).resolves.toEqual({
        data: { status: 'ok', database: 'ok' },
      });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
