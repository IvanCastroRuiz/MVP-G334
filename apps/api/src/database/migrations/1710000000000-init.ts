import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1710000000000 implements MigrationInterface {
  name = 'Init1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS auth_rbac');
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS crm');

    await queryRunner.query(`
      CREATE TABLE auth_rbac.companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        name text NOT NULL,
        password_hash text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_company ON auth_rbac.users (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.modules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        key text NOT NULL UNIQUE,
        name text NOT NULL,
        visibility text NOT NULL DEFAULT 'public',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id uuid NOT NULL REFERENCES auth_rbac.modules(id) ON DELETE CASCADE,
        action text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_permissions_module_action
      ON auth_rbac.permissions (module_id, action)
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.role_permissions (
        role_id uuid NOT NULL REFERENCES auth_rbac.roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES auth_rbac.permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.user_roles (
        user_id uuid NOT NULL REFERENCES auth_rbac.users(id) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES auth_rbac.roles(id) ON DELETE CASCADE,
        company_id uuid NOT NULL,
        PRIMARY KEY (user_id, role_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_roles_company ON auth_rbac.user_roles (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth_rbac.users(id) ON DELETE CASCADE,
        token_hash text NOT NULL,
        expires_at timestamptz NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_refresh_tokens_user ON auth_rbac.refresh_tokens (user_id)
    `);

    await queryRunner.query(`
      CREATE TABLE auth_rbac.audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL,
        user_id uuid NULL,
        action text NOT NULL,
        metadata jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_log_company ON auth_rbac.audit_log (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE crm.projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_projects_company ON crm.projects (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE crm.boards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        project_id uuid NOT NULL REFERENCES crm.projects(id) ON DELETE CASCADE,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_boards_company ON crm.boards (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE crm.board_columns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        board_id uuid NOT NULL REFERENCES crm.boards(id) ON DELETE CASCADE,
        name text NOT NULL,
        order_index integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_board_columns_board ON crm.board_columns (board_id)
    `);

    await queryRunner.query(`
      CREATE TABLE crm.tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        project_id uuid NOT NULL REFERENCES crm.projects(id) ON DELETE CASCADE,
        board_id uuid NOT NULL REFERENCES crm.boards(id) ON DELETE CASCADE,
        board_column_id uuid NOT NULL REFERENCES crm.board_columns(id) ON DELETE RESTRICT,
        title text NOT NULL,
        description text NULL,
        priority text NOT NULL CHECK (priority IN ('low','medium','high','critical')) DEFAULT 'medium',
        status text NOT NULL DEFAULT 'open',
        assigned_to uuid NULL,
        due_date timestamptz NULL,
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_tasks_company ON crm.tasks (company_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_tasks_board_column ON crm.tasks (board_id, board_column_id)
    `);

    await queryRunner.query(`
      CREATE TABLE crm.task_comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES auth_rbac.companies(id) ON DELETE CASCADE,
        task_id uuid NOT NULL REFERENCES crm.tasks(id) ON DELETE CASCADE,
        author_id uuid NOT NULL REFERENCES auth_rbac.users(id) ON DELETE RESTRICT,
        content text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_task_comments_task ON crm.task_comments (task_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS crm.task_comments');
    await queryRunner.query('DROP TABLE IF EXISTS crm.tasks');
    await queryRunner.query('DROP TABLE IF EXISTS crm.board_columns');
    await queryRunner.query('DROP TABLE IF EXISTS crm.boards');
    await queryRunner.query('DROP TABLE IF EXISTS crm.projects');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.audit_log');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.refresh_tokens');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.user_roles');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.role_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.permissions');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.roles');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.modules');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.users');
    await queryRunner.query('DROP TABLE IF EXISTS auth_rbac.companies');
    await queryRunner.query('DROP SCHEMA IF EXISTS crm CASCADE');
    await queryRunner.query('DROP SCHEMA IF EXISTS auth_rbac CASCADE');
  }
}
