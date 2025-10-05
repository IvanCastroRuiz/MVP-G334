import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleParent1710100000000 implements MigrationInterface {
  name = 'AddModuleParent1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE auth_rbac.modules ADD COLUMN parent_id uuid NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE auth_rbac.modules
      ADD CONSTRAINT fk_modules_parent
      FOREIGN KEY (parent_id)
      REFERENCES auth_rbac.modules(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
    await queryRunner.query(
      `CREATE INDEX idx_modules_parent ON auth_rbac.modules (parent_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS auth_rbac.idx_modules_parent`,
    );
    await queryRunner.query(
      `ALTER TABLE auth_rbac.modules DROP CONSTRAINT IF EXISTS fk_modules_parent`,
    );
    await queryRunner.query(
      `ALTER TABLE auth_rbac.modules DROP COLUMN parent_id`,
    );
  }
}
