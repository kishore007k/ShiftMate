import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserId1720000000003 implements MigrationInterface {
  name = 'AddUserId1720000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shifts" ADD COLUMN "user_id" UUID`);
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_user_date" ON "shifts" ("user_id", "date")`,
    );

    // user_settings was keyed by device_id alone; give it a surrogate id so a row can
    // eventually be looked up by user_id OR device_id once auth lands.
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD COLUMN "id" UUID DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(`UPDATE "user_settings" SET "id" = gen_random_uuid()`);
    await queryRunner.query(`ALTER TABLE "user_settings" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_pkey"`,
    );
    await queryRunner.query(`ALTER TABLE "user_settings" ADD PRIMARY KEY ("id")`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_device_id_key" UNIQUE ("device_id")`,
    );
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN "user_id" UUID`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_key"`,
    );
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_device_id_key"`,
    );
    await queryRunner.query(`ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_pkey"`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD PRIMARY KEY ("device_id")`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN "id"`);

    await queryRunner.query(`DROP INDEX "idx_shifts_user_date"`);
    await queryRunner.query(`ALTER TABLE "shifts" DROP COLUMN "user_id"`);
  }
}
