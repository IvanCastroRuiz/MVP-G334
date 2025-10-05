import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHrModule1710000001000 implements MigrationInterface {
  name = 'AddHrModule1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS hr');

    await queryRunner.query(
      "CREATE TYPE hr.employee_status AS ENUM ('hired', 'terminated', 'on_leave')",
    );
    await queryRunner.query(
      "CREATE TYPE hr.leave_type AS ENUM ('vacation', 'sick', 'personal', 'other')",
    );
    await queryRunner.query(
      "CREATE TYPE hr.leave_status AS ENUM ('pending', 'approved', 'rejected')",
    );

    await queryRunner.query(`
      CREATE TABLE hr.employees (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        user_id uuid NULL REFERENCES auth_rbac.users(id) ON DELETE SET NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text NULL,
        position text NULL,
        department text NULL,
        hire_date date NOT NULL,
        termination_date date NULL,
        status hr.employee_status NOT NULL DEFAULT 'hired',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX idx_hr_employees_company ON hr.employees (company_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_hr_employees_status ON hr.employees (status)',
    );

    await queryRunner.query(`
      CREATE TABLE hr.employment_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        employee_id uuid NOT NULL REFERENCES hr.employees(id) ON DELETE CASCADE,
        status hr.employee_status NOT NULL,
        effective_date date NOT NULL,
        notes text NULL,
        changed_by uuid NULL REFERENCES auth_rbac.users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX idx_hr_employment_history_company ON hr.employment_history (company_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_hr_employment_history_employee ON hr.employment_history (employee_id)',
    );

    await queryRunner.query(`
      CREATE TABLE hr.leave_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        employee_id uuid NOT NULL REFERENCES hr.employees(id) ON DELETE CASCADE,
        requested_by uuid NULL REFERENCES auth_rbac.users(id) ON DELETE SET NULL,
        type hr.leave_type NOT NULL,
        status hr.leave_status NOT NULL DEFAULT 'pending',
        start_date date NOT NULL,
        end_date date NOT NULL,
        reason text NULL,
        approved_by uuid NULL REFERENCES auth_rbac.users(id) ON DELETE SET NULL,
        decided_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX idx_hr_leave_requests_company ON hr.leave_requests (company_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_hr_leave_requests_employee ON hr.leave_requests (employee_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_hr_leave_requests_status ON hr.leave_requests (status)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_hr_leave_requests_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_hr_leave_requests_employee');
    await queryRunner.query('DROP INDEX IF EXISTS idx_hr_leave_requests_company');
    await queryRunner.query('DROP TABLE IF EXISTS hr.leave_requests');

    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_hr_employment_history_employee',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_hr_employment_history_company',
    );
    await queryRunner.query('DROP TABLE IF EXISTS hr.employment_history');

    await queryRunner.query('DROP INDEX IF EXISTS idx_hr_employees_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_hr_employees_company');
    await queryRunner.query('DROP TABLE IF EXISTS hr.employees');

    await queryRunner.query("DROP TYPE IF EXISTS hr.leave_status");
    await queryRunner.query("DROP TYPE IF EXISTS hr.leave_type");
    await queryRunner.query("DROP TYPE IF EXISTS hr.employee_status");
  }
}
