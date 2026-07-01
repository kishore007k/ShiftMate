import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomeAddress1720000000002 implements MigrationInterface {
  name = 'AddHomeAddress1720000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD COLUMN "home_address" TEXT NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "home_address"`);
  }
}
