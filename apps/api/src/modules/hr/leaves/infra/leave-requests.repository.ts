import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestOrmEntity } from './leave-request.orm-entity.js';
import type { LeaveRequestsRepositoryPort } from '../application/ports/leave-requests.repository-port.js';
import type { ListLeaveFilters } from '../application/dto/list-leave-filters.dto.js';
import type { CreateLeaveRequestInput } from '../application/dto/create-leave-request.input.js';
import { LeaveRequest } from '../domain/entities/leave-request.entity.js';

@Injectable()
export class LeaveRequestsRepository implements LeaveRequestsRepositoryPort {
  constructor(
    @InjectRepository(LeaveRequestOrmEntity)
    private readonly leaveRepository: Repository<LeaveRequestOrmEntity>,
  ) {}

  async list(
    companyId: string,
    filters: ListLeaveFilters,
  ): Promise<LeaveRequest[]> {
    const where: any = { companyId };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    const leaves = await this.leaveRepository.find({
      where,
      order: { startDate: 'DESC' },
    });
    return leaves.map((leave) => this.toDomain(leave));
  }

  async findById(companyId: string, leaveId: string): Promise<LeaveRequest | null> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId, companyId },
    });
    return leave ? this.toDomain(leave) : null;
  }

  async create(
    companyId: string,
    requestedBy: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    const entity = this.leaveRepository.create({
      companyId,
      employeeId: input.employeeId,
      requestedBy,
      type: input.type,
      status: 'pending',
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason ?? null,
    });
    const saved = await this.leaveRepository.save(entity);
    return this.toDomain(saved);
  }

  async updateStatus(
    companyId: string,
    leaveId: string,
    input: {
      status: LeaveRequest['status'];
      approverId: string;
      notes: string | null;
    },
  ): Promise<LeaveRequest | null> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId, companyId },
    });
    if (!leave) {
      return null;
    }
    leave.status = input.status;
    leave.approvedBy = input.approverId;
    leave.decidedAt = new Date();
    const saved = await this.leaveRepository.save(leave);
    return this.toDomain(saved);
  }

  private toDomain(entity: LeaveRequestOrmEntity): LeaveRequest {
    return new LeaveRequest(
      entity.id,
      entity.companyId,
      entity.employeeId,
      entity.type,
      entity.status,
      entity.startDate instanceof Date
        ? entity.startDate
        : new Date(entity.startDate),
      entity.endDate instanceof Date
        ? entity.endDate
        : new Date(entity.endDate),
      entity.reason,
      entity.requestedBy,
      entity.approvedBy,
      entity.decidedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
