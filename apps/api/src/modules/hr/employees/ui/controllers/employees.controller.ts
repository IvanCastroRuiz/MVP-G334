import { Inject } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { EmployeeDetailsDto, EmployeeSummaryDto } from '@mvp/shared';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard.js';
import { RbacGuard } from '@common/guards/rbac.guard.js';
import { Permissions } from '@common/decorators/permissions.decorator.js';
import { EmployeesService } from '../../application/services/employees.service.js';
import { ListEmployeesFilters } from '../../application/dto/list-employees-filters.dto.js';
import { CreateEmployeeInput } from '../../application/dto/create-employee.input.js';
import { UpdateEmployeeInput } from '../../application/dto/update-employee.input.js';
import { TerminateEmployeeInput } from '../../application/dto/terminate-employee.input.js';
import { ReactivateEmployeeInput } from '../../application/dto/reactivate-employee.input.js';
import type { Employee } from '../../domain/entities/employee.entity.js';

class ListEmployeesQuery {
  @IsOptional()
  @IsIn(['hired', 'terminated', 'on_leave'], { message: 'Invalid status' })
  status?: 'hired' | 'terminated' | 'on_leave';

  @IsOptional()
  @IsString()
  search?: string;
}

class CreateEmployeeRequest {
  @IsString()
  @Length(1, 120)
  firstName!: string;

  @IsString()
  @Length(1, 120)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @Type(() => Date)
  @IsDate()
  hireDate!: Date;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}

class UpdateEmployeeRequest {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  position?: string | null;

  @IsOptional()
  @IsString()
  department?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hireDate?: Date;
}

class TerminateEmployeeRequest {
  @Type(() => Date)
  @IsDate()
  terminationDate!: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

class ReactivateEmployeeRequest {
  @Type(() => Date)
  @IsDate()
  hireDate!: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('hr/employees')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EmployeesController {
  constructor(@Inject(EmployeesService) private readonly employeesService: EmployeesService) {}

  @Get()
  @Permissions('hr-employees:read')
  async listEmployees(
    @Req() req: any,
    @Query() query: ListEmployeesQuery,
  ): Promise<EmployeeSummaryDto[]> {
    const employees = await this.employeesService.listEmployees(
      req.user.companyId,
      new ListEmployeesFilters(query.status, query.search),
    );
    return employees.map((employee) => this.toSummaryDto(employee));
  }

  @Post()
  @Permissions('hr-employees:create')
  async createEmployee(
    @Req() req: any,
    @Body() body: CreateEmployeeRequest,
  ): Promise<EmployeeDetailsDto> {
    const employee = await this.employeesService.createEmployee(
      req.user.companyId,
      req.user.userId,
      new CreateEmployeeInput(
        body.firstName,
        body.lastName,
        body.email ?? null,
        body.position ?? null,
        body.department ?? null,
        body.hireDate,
        body.userId ?? null,
        body.roleId ?? null,
      ),
    );
    return this.toDetailsDto(employee);
  }

  @Get(':employeeId')
  @Permissions('hr-employees:read')
  async getEmployee(
    @Req() req: any,
    @Param('employeeId') employeeId: string,
  ): Promise<EmployeeDetailsDto> {
    const employee = await this.employeesService.getEmployee(
      req.user.companyId,
      employeeId,
    );
    return this.toDetailsDto(employee);
  }

  @Patch(':employeeId')
  @Permissions('hr-employees:update')
  async updateEmployee(
    @Req() req: any,
    @Param('employeeId') employeeId: string,
    @Body() body: UpdateEmployeeRequest,
  ): Promise<EmployeeDetailsDto> {
    const employee = await this.employeesService.updateEmployee(
      req.user.companyId,
      req.user.userId,
      employeeId,
      new UpdateEmployeeInput(
        body.firstName,
        body.lastName,
        body.email ?? null,
        body.position ?? null,
        body.department ?? null,
        body.hireDate,
      ),
    );
    return this.toDetailsDto(employee);
  }

  @Post(':employeeId/terminate')
  @Permissions('hr-employees:terminate')
  async terminateEmployee(
    @Req() req: any,
    @Param('employeeId') employeeId: string,
    @Body() body: TerminateEmployeeRequest,
  ): Promise<EmployeeDetailsDto> {
    const employee = await this.employeesService.terminateEmployee(
      req.user.companyId,
      req.user.userId,
      employeeId,
      new TerminateEmployeeInput(body.terminationDate, body.reason ?? null),
    );
    return this.toDetailsDto(employee);
  }

  @Post(':employeeId/reactivate')
  @Permissions('hr-employees:update')
  async reactivateEmployee(
    @Req() req: any,
    @Param('employeeId') employeeId: string,
    @Body() body: ReactivateEmployeeRequest,
  ): Promise<EmployeeDetailsDto> {
    const employee = await this.employeesService.reactivateEmployee(
      req.user.companyId,
      req.user.userId,
      employeeId,
      new ReactivateEmployeeInput(body.hireDate, body.notes ?? null),
    );
    return this.toDetailsDto(employee);
  }

  private toSummaryDto(employee: Employee): EmployeeSummaryDto {
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      status: employee.status,
      hireDate: employee.hireDate.toISOString(),
      terminationDate: employee.terminationDate
        ? employee.terminationDate.toISOString()
        : null,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  private toDetailsDto(employee: Employee): EmployeeDetailsDto {
    return {
      ...this.toSummaryDto(employee),
      fullName: employee.fullName,
      userId: employee.userId,
    };
  }
}
