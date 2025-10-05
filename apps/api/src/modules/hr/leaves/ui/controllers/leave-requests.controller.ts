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
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type { LeaveRequestDto } from '@mvp/shared';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard.js';
import { RbacGuard } from '@common/guards/rbac.guard.js';
import { Permissions } from '@common/decorators/permissions.decorator.js';
import { LeaveRequestsService } from '../../application/services/leave-requests.service.js';
import { ListLeaveFilters } from '../../application/dto/list-leave-filters.dto.js';
import { CreateLeaveRequestInput } from '../../application/dto/create-leave-request.input.js';
import type { LeaveRequest } from '../../domain/entities/leave-request.entity.js';

const LEAVE_TYPES = ['vacation', 'sick', 'personal', 'other'] as const;
const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const;

type LeaveType = (typeof LEAVE_TYPES)[number];

type LeaveStatus = (typeof LEAVE_STATUSES)[number];

class ListLeavesQuery {
  @IsOptional()
  @IsIn(LEAVE_STATUSES)
  status?: LeaveStatus;

  @IsOptional()
  @IsIn(LEAVE_TYPES)
  type?: LeaveType;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

class CreateLeaveRequestBody {
  @IsUUID()
  employeeId!: string;

  @IsIn(LEAVE_TYPES)
  type!: LeaveType;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

class LeaveDecisionBody {
  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('hr/leaves')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LeaveRequestsController {
  constructor(
    @Inject(LeaveRequestsService)
    private readonly leaveRequestsService: LeaveRequestsService,
  ) {}

  @Get()
  @Permissions('hr:leaves.read')
  async listLeaves(
    @Req() req: any,
    @Query() query: ListLeavesQuery,
  ): Promise<LeaveRequestDto[]> {
    const leaves = await this.leaveRequestsService.listLeaveRequests(
      req.user.companyId,
      new ListLeaveFilters(query.status, query.type, query.employeeId),
    );
    return leaves.map((leave) => this.toDto(leave));
  }

  @Post()
  @Permissions('hr:leaves.manage')
  async createLeave(
    @Req() req: any,
    @Body() body: CreateLeaveRequestBody,
  ): Promise<LeaveRequestDto> {
    const leave = await this.leaveRequestsService.createLeaveRequest(
      req.user.companyId,
      req.user.userId,
      new CreateLeaveRequestInput(
        body.employeeId,
        body.type,
        body.startDate,
        body.endDate,
        body.reason ?? null,
      ),
    );
    return this.toDto(leave);
  }

  @Patch(':leaveId/approve')
  @Permissions('hr:leaves.manage')
  async approveLeave(
    @Req() req: any,
    @Param('leaveId') leaveId: string,
    @Body() body: LeaveDecisionBody,
  ): Promise<LeaveRequestDto> {
    const leave = await this.leaveRequestsService.approveLeave(
      req.user.companyId,
      req.user.userId,
      leaveId,
      body.notes ?? null,
    );
    return this.toDto(leave);
  }

  @Patch(':leaveId/reject')
  @Permissions('hr:leaves.manage')
  async rejectLeave(
    @Req() req: any,
    @Param('leaveId') leaveId: string,
    @Body() body: LeaveDecisionBody,
  ): Promise<LeaveRequestDto> {
    const leave = await this.leaveRequestsService.rejectLeave(
      req.user.companyId,
      req.user.userId,
      leaveId,
      body.notes ?? null,
    );
    return this.toDto(leave);
  }

  private toDto(leave: LeaveRequest): LeaveRequestDto {
    return {
      id: leave.id,
      employeeId: leave.employeeId,
      companyId: leave.companyId,
      type: leave.type,
      status: leave.status,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      reason: leave.reason,
      requestedBy: leave.requestedBy,
      approvedBy: leave.approvedBy,
      decidedAt: leave.decidedAt ? leave.decidedAt.toISOString() : null,
      createdAt: leave.createdAt.toISOString(),
      updatedAt: leave.updatedAt.toISOString(),
    };
  }
}
