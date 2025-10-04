import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRbacModule } from '../auth-rbac/auth-rbac.module.js';
import { EmployeeOrmEntity } from './employees/infra/employee.orm-entity.js';
import { EmploymentHistoryOrmEntity } from './employees/infra/employment-history.orm-entity.js';
import { LeaveRequestOrmEntity } from './leaves/infra/leave-request.orm-entity.js';
import { EmployeesService } from './employees/application/services/employees.service.js';
import { LeaveRequestsService } from './leaves/application/services/leave-requests.service.js';
import { EmployeesRepository } from './employees/infra/employees.repository.js';
import { LeaveRequestsRepository } from './leaves/infra/leave-requests.repository.js';
import { EmployeesController } from './employees/ui/controllers/employees.controller.js';
import { LeaveRequestsController } from './leaves/ui/controllers/leave-requests.controller.js';
import { EMPLOYEES_REPOSITORY, LEAVE_REQUESTS_REPOSITORY } from './port.tokens.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeOrmEntity,
      EmploymentHistoryOrmEntity,
      LeaveRequestOrmEntity,
    ]),
    AuthRbacModule,
  ],
  providers: [
    EmployeesService,
    LeaveRequestsService,
    EmployeesRepository,
    LeaveRequestsRepository,
    { provide: EMPLOYEES_REPOSITORY, useExisting: EmployeesRepository },
    { provide: LEAVE_REQUESTS_REPOSITORY, useExisting: LeaveRequestsRepository },
  ],
  controllers: [EmployeesController, LeaveRequestsController],
  exports: [EmployeesService, LeaveRequestsService, EMPLOYEES_REPOSITORY, LEAVE_REQUESTS_REPOSITORY],
})
export class HrModule {}
