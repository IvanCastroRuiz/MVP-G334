import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import helmet from 'helmet';
import { AppModule } from '../src/app.module.js';
import { AppDataSource } from '../src/database/data-source.js';
import { runSeed } from '../src/database/seed.js';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from '../src/modules/auth-rbac/infra/typeorm/user.orm-entity.js';
import { RoleOrmEntity } from '../src/modules/auth-rbac/infra/typeorm/role.orm-entity.js';
import { UserRoleOrmEntity } from '../src/modules/auth-rbac/infra/typeorm/user-role.orm-entity.js';
import * as argon2 from 'argon2';

describe('API E2E', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await AppDataSource.destroy();
    await runSeed();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.use(helmet());

    await app.init();
    httpServer = app.getHttpServer();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
    await AppDataSource.destroy().catch(() => undefined);
  });

  it('logs in with seeded admin user', async () => {
    const response = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'devadmin@example.com', password: 'DevAdmin123!' })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('denies task creation for viewer role', async () => {
    const roleRepo = dataSource.getRepository(RoleOrmEntity);
    const viewerRole = await roleRepo.findOne({ where: { name: 'Viewer' } });
    expect(viewerRole).toBeDefined();

    const userRepo = dataSource.getRepository(UserOrmEntity);
    const viewerUser = userRepo.create({
      companyId: viewerRole!.companyId,
      email: 'viewer@example.com',
      name: 'Viewer User',
      passwordHash: await argon2.hash('Viewer123!'),
    });
    const savedViewer = await userRepo.save(viewerUser);

    const userRoleRepo = dataSource.getRepository(UserRoleOrmEntity);
    await userRoleRepo.save({
      userId: savedViewer.id,
      roleId: viewerRole!.id,
      companyId: viewerRole!.companyId,
    });

    const loginResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.com', password: 'Viewer123!' })
      .expect(201);

    const token = loginResponse.body.accessToken;
    const boardsResponse = await request(httpServer)
      .get('/api/v1/kanban/boards')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const [board] = boardsResponse.body;
    expect(board).toBeDefined();

    const boardDetails = await request(httpServer)
      .get(`/api/v1/kanban/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const columnId = boardDetails.body.columns[0].id;

    await request(httpServer)
      .post('/api/v1/kanban/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Unauthorized task',
        projectId: board.projectId,
        boardId: board.id,
        boardColumnId: columnId,
      })
      .expect(403);
  });

  it('creates and moves task when permissions are granted', async () => {
    const loginResponse = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'devadmin@example.com', password: 'DevAdmin123!' })
      .expect(201);

    const token = loginResponse.body.accessToken;

    const boardsResponse = await request(httpServer)
      .get('/api/v1/kanban/boards')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const board = boardsResponse.body[0];
    expect(board).toBeDefined();

    const boardDetails = await request(httpServer)
      .get(`/api/v1/kanban/boards/${board.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const targetColumn = boardDetails.body.columns[0];
    expect(targetColumn).toBeDefined();

    const createResponse = await request(httpServer)
      .post('/api/v1/kanban/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Automated test task',
        projectId: board.projectId,
        boardId: board.id,
        boardColumnId: targetColumn.id,
      })
      .expect(201);

    const taskId = createResponse.body.id;
    expect(taskId).toBeDefined();

    const destinationColumn = boardDetails.body.columns[boardDetails.body.columns.length - 1];
    await request(httpServer)
      .post(`/api/v1/kanban/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ boardColumnId: destinationColumn.id })
      .expect(201);
  });
});
