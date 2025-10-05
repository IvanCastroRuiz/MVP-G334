import { AppDataSource } from './data-source.js';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { CompanyOrmEntity } from '../modules/auth-rbac/infra/typeorm/company.orm-entity.js';
import { ModuleOrmEntity } from '../modules/auth-rbac/infra/typeorm/module.orm-entity.js';
import { PermissionOrmEntity } from '../modules/auth-rbac/infra/typeorm/permission.orm-entity.js';
import { RoleOrmEntity } from '../modules/auth-rbac/infra/typeorm/role.orm-entity.js';
import { RolePermissionOrmEntity } from '../modules/auth-rbac/infra/typeorm/role-permission.orm-entity.js';
import { UserOrmEntity } from '../modules/auth-rbac/infra/typeorm/user.orm-entity.js';
import { UserRoleOrmEntity } from '../modules/auth-rbac/infra/typeorm/user-role.orm-entity.js';
import { ProjectOrmEntity } from '../modules/crm/projects/infra/project.orm-entity.js';
import { BoardOrmEntity } from '../modules/crm/boards/infra/board.orm-entity.js';
import { BoardColumnOrmEntity } from '../modules/crm/boards/infra/board-column.orm-entity.js';
import { TaskOrmEntity } from '../modules/crm/tasks/infra/task.orm-entity.js';
import { EmployeeOrmEntity } from '../modules/hr/employees/infra/employee.orm-entity.js';
import { EmploymentHistoryOrmEntity } from '../modules/hr/employees/infra/employment-history.orm-entity.js';
import { LeaveRequestOrmEntity } from '../modules/hr/leaves/infra/leave-request.orm-entity.js';

export async function runSeed() {
  await AppDataSource.initialize();
  const companyRepository = AppDataSource.getRepository(CompanyOrmEntity);
  const moduleRepository = AppDataSource.getRepository(ModuleOrmEntity);
  const permissionRepository = AppDataSource.getRepository(PermissionOrmEntity);
  const roleRepository = AppDataSource.getRepository(RoleOrmEntity);
  const rolePermissionRepository = AppDataSource.getRepository(
    RolePermissionOrmEntity,
  );
  const userRepository = AppDataSource.getRepository(UserOrmEntity);
  const userRoleRepository = AppDataSource.getRepository(UserRoleOrmEntity);
  const projectRepository = AppDataSource.getRepository(ProjectOrmEntity);
  const boardRepository = AppDataSource.getRepository(BoardOrmEntity);
  const boardColumnRepository = AppDataSource.getRepository(
    BoardColumnOrmEntity,
  );
  const taskRepository = AppDataSource.getRepository(TaskOrmEntity);
  const employeeRepository = AppDataSource.getRepository(EmployeeOrmEntity);
  const employmentHistoryRepository = AppDataSource.getRepository(
    EmploymentHistoryOrmEntity,
  );
  const leaveRequestRepository = AppDataSource.getRepository(
    LeaveRequestOrmEntity,
  );

  let company = await companyRepository.findOne({
    where: { name: 'Dev Company' },
  });

  if (!company) {
    company = companyRepository.create({ name: 'Dev Company' });
    company = await companyRepository.save(company);
  }

  const moduleDefinitions: Array<{
    key: string;
    name: string;
    visibility: 'public' | 'dev_only';
    isActive: boolean;
    parentKey: string | null;
  }> = [
    {
      key: 'rbac',
      name: 'RBAC Admin',
      visibility: 'dev_only',
      isActive: true,
      parentKey: null,
    },
    {
      key: 'projects',
      name: 'Projects',
      visibility: 'public',
      isActive: true,
      parentKey: null,
    },
    {
      key: 'boards',
      name: 'Boards',
      visibility: 'public',
      isActive: true,
      parentKey: 'projects',
    },
    {
      key: 'tasks',
      name: 'Tasks',
      visibility: 'public',
      isActive: true,
      parentKey: 'boards',
    },
    {
      key: 'comments',
      name: 'Comments',
      visibility: 'public',
      isActive: true,
      parentKey: 'tasks',
    },
    {
      key: 'hr',
      name: 'Human Resources',
      visibility: 'public',
      isActive: true,
      parentKey: null,
    },
    {
      key: 'hr-employees',
      name: 'Employees',
      visibility: 'public',
      isActive: true,
      parentKey: 'hr',
    },
    {
      key: 'hr-leaves',
      name: 'Leave Management',
      visibility: 'public',
      isActive: true,
      parentKey: 'hr',
    },
  ];

  const moduleMap = new Map<string, ModuleOrmEntity>();

  for (const module of moduleDefinitions) {
    let existing = await moduleRepository.findOne({ where: { key: module.key } });
    const parent = module.parentKey ? moduleMap.get(module.parentKey) : undefined;
    if (!existing) {
      existing = moduleRepository.create({
        key: module.key,
        name: module.name,
        visibility: module.visibility as 'public' | 'dev_only',
        isActive: module.isActive,
        companyId: null,
        parentId: parent?.id ?? null,
      });
      existing = await moduleRepository.save(existing);
    } else {
      const expectedParentId = parent?.id ?? null;
      if (existing.parentId !== expectedParentId) {
        existing.parentId = expectedParentId;
        existing = await moduleRepository.save(existing);
      }
    }
    moduleMap.set(module.key, existing);
  }

  const permissionsByModule: Record<string, string[]> = {
    rbac: ['read'],
    projects: ['read'],
    boards: ['read'],
    tasks: ['create', 'read', 'update', 'move', 'delete', 'comment'],
    comments: ['create', 'read'],
    hr: [
      'employees.read',
      'employees.create',
      'employees.update',
      'employees.terminate',
      'leaves.read',
      'leaves.request',
      'leaves.manage',
    ],
  };

  const permissionMap = new Map<string, PermissionOrmEntity>();

  for (const [moduleKey, actions] of Object.entries(permissionsByModule)) {
    const module = moduleMap.get(moduleKey)!;
    for (const action of actions) {
      let permission = await permissionRepository.findOne({
        where: { moduleId: module.id, action },
      });
      if (!permission) {
        permission = permissionRepository.create({
          moduleId: module.id,
          action,
        });
        permission = await permissionRepository.save(permission);
      }
      permissionMap.set(`${moduleKey}:${action}`, permission);
    }
  }

  const roles = [
    {
      name: 'DevAdmin',
      description: 'Full access',
      permissions: [
        'rbac:read',
        'projects:read',
        'boards:read',
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:move',
        'tasks:delete',
        'tasks:comment',
        'comments:create',
        'comments:read',
        'hr:employees.read',
        'hr:employees.create',
        'hr:employees.update',
        'hr:employees.terminate',
        'hr:leaves.read',
        'hr:leaves.request',
        'hr:leaves.manage',
      ],
    },
    {
      name: 'Admin',
      description: 'Manage boards and tasks',
      permissions: [
        'projects:read',
        'boards:read',
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:move',
        'tasks:comment',
        'comments:create',
        'comments:read',
        'hr:employees.read',
        'hr:employees.create',
        'hr:employees.update',
        'hr:employees.terminate',
        'hr:leaves.read',
        'hr:leaves.request',
        'hr:leaves.manage',
      ],
    },
    {
      name: 'Manager',
      description: 'Manage tasks',
      permissions: [
        'projects:read',
        'boards:read',
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:move',
        'tasks:comment',
        'comments:create',
        'comments:read',
      ],
    },
    {
      name: 'Contributor',
      description: 'Work on tasks',
      permissions: [
        'projects:read',
        'boards:read',
        'tasks:read',
        'tasks:update',
        'tasks:move',
        'tasks:comment',
        'comments:create',
        'comments:read',
      ],
    },
    {
      name: 'HR Manager',
      description: 'Manage employees and leave requests',
      permissions: [
        'projects:read',
        'boards:read',
        'tasks:read',
        'comments:read',
        'hr:employees.read',
        'hr:employees.create',
        'hr:employees.update',
        'hr:employees.terminate',
        'hr:leaves.read',
        'hr:leaves.request',
        'hr:leaves.manage',
      ],
    },
    {
      name: 'Viewer',
      description: 'Read-only',
      permissions: ['projects:read', 'boards:read', 'tasks:read', 'comments:read'],
    },
    {
      name: 'HR Manager',
      description: 'Manage employees and leaves',
      permissions: [
        'hr:employees.read',
        'hr:employees.create',
        'hr:employees.update',
        'hr:employees.terminate',
        'hr:leaves.read',
        'hr:leaves.manage',
      ],
    },
  ];

  const roleMap = new Map<string, RoleOrmEntity>();

  for (const role of roles) {
    let roleEntity = await roleRepository.findOne({
      where: { companyId: company.id, name: role.name },
    });
    if (!roleEntity) {
      roleEntity = roleRepository.create({
        companyId: company.id,
        name: role.name,
        description: role.description ?? null,
      });
      roleEntity = await roleRepository.save(roleEntity);
    }
    roleMap.set(role.name, roleEntity);

    for (const permissionKey of role.permissions) {
      const permission = permissionMap.get(permissionKey);
      if (!permission) {
        continue;
      }
      const existing = await rolePermissionRepository.findOne({
        where: {
          roleId: roleEntity.id,
          permissionId: permission.id,
        },
      });
      if (!existing) {
        const relation = rolePermissionRepository.create({
          roleId: roleEntity.id,
          permissionId: permission.id,
        });
        await rolePermissionRepository.save(relation);
      }
    }
  }

  let user = await userRepository.findOne({ where: { email: 'devadmin@example.com' } });
  if (!user) {
    user = userRepository.create({
      companyId: company.id,
      email: 'devadmin@example.com',
      name: 'Dev Admin',
      passwordHash: await argon2Hash('DevAdmin123!'),
    });
    user = await userRepository.save(user);
  }

  const devAdminRole = roleMap.get('DevAdmin');
  if (devAdminRole) {
    const userRole = await userRoleRepository.findOne({
      where: { userId: user.id, roleId: devAdminRole.id },
    });
    if (!userRole) {
      await userRoleRepository.save({
        userId: user.id,
        roleId: devAdminRole.id,
        companyId: company.id,
      });
    }
  }

  let project = await projectRepository.findOne({
    where: { companyId: company.id, name: 'Demo Project' },
  });
  if (!project) {
    project = projectRepository.create({
      companyId: company.id,
      name: 'Demo Project',
      description: 'Seed project',
    });
    project = await projectRepository.save(project);
  }

  let board = await boardRepository.findOne({
    where: { companyId: company.id, name: 'Demo Board' },
  });
  if (!board) {
    board = boardRepository.create({
      companyId: company.id,
      projectId: project.id,
      name: 'Demo Board',
    });
    board = await boardRepository.save(board);
  }

  const columnDefinitions = [
    { name: 'To Do', orderIndex: 1 },
    { name: 'Doing', orderIndex: 2 },
    { name: 'Done', orderIndex: 3 },
  ];

  const columns: BoardColumnOrmEntity[] = [];
  for (const columnDef of columnDefinitions) {
    let column = await boardColumnRepository.findOne({
      where: {
        companyId: company.id,
        boardId: board.id,
        name: columnDef.name,
      },
    });
    if (!column) {
      column = boardColumnRepository.create({
        companyId: company.id,
        boardId: board.id,
        name: columnDef.name,
        orderIndex: columnDef.orderIndex,
      });
      column = await boardColumnRepository.save(column);
    }
    columns.push(column);
  }

  const tasks = [
    { title: 'Setup local environment', columnName: 'To Do' },
    { title: 'Design Kanban board', columnName: 'Doing' },
    { title: 'Review seed data', columnName: 'Done' },
  ];

  for (const task of tasks) {
    const column = columns.find((item) => item.name === task.columnName);
    if (!column) {
      continue;
    }
    const existingTask = await taskRepository.findOne({
      where: {
        companyId: company.id,
        boardId: board.id,
        title: task.title,
      },
    });
    if (!existingTask) {
      const entity = taskRepository.create({
        companyId: company.id,
        projectId: project.id,
        boardId: board.id,
        boardColumnId: column.id,
        title: task.title,
        description: `${task.title} description`,
        priority: 'medium',
        status: 'open',
        createdBy: user.id,
      });
      await taskRepository.save(entity);
    }
  }

  let employee = await employeeRepository.findOne({
    where: { companyId: company.id, email: 'jane.doe@example.com' },
  });
  if (!employee) {
    employee = employeeRepository.create({
      companyId: company.id,
      userId: null,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      position: 'HR Specialist',
      department: 'Human Resources',
      hireDate: new Date('2022-01-15'),
      terminationDate: null,
      status: 'hired',
    });
    employee = await employeeRepository.save(employee);
  }

  const existingHistory = await employmentHistoryRepository.findOne({
    where: {
      companyId: company.id,
      employeeId: employee.id,
      status: 'hired',
    },
  });
  if (!existingHistory) {
    await employmentHistoryRepository.save(
      employmentHistoryRepository.create({
        companyId: company.id,
        employeeId: employee.id,
        status: 'hired',
        effectiveDate: new Date('2022-01-15'),
        notes: 'Initial hiring',
        changedBy: user.id,
      }),
    );
  }

  const leaveStart = new Date('2023-07-01');
  const leaveEnd = new Date('2023-07-10');
  const existingLeave = await leaveRequestRepository.findOne({
    where: {
      companyId: company.id,
      employeeId: employee.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      type: 'vacation',
    },
  });
  if (!existingLeave) {
    await leaveRequestRepository.save(
      leaveRequestRepository.create({
        companyId: company.id,
        employeeId: employee.id,
        requestedBy: user.id,
        type: 'vacation',
        status: 'pending',
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: 'Summer vacation',
        approvedBy: null,
        decidedAt: null,
      }),
    );
  }

  await AppDataSource.destroy();
  console.log('Seed completed');
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  runSeed().catch(async (error) => {
    console.error(error);
    await AppDataSource.destroy();
    process.exit(1);
  });
}
