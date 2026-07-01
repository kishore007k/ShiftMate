import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1720000000001 implements MigrationInterface {
  name = 'Initial1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shifts" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "device_id"    TEXT NOT NULL,
        "date"         DATE NOT NULL,
        "start_time"   TIME NOT NULL,
        "end_time"     TIME NOT NULL,
        "hours_worked" NUMERIC(5,2) NOT NULL,
        "gross_pay"    NUMERIC(10,2) NOT NULL,
        "notes"        TEXT,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_shifts_device_date" ON "shifts" ("device_id", "date")
    `);

    await queryRunner.query(`
      CREATE TABLE "user_settings" (
        "device_id"          TEXT PRIMARY KEY,
        "hourly_rate"        NUMERIC(8,2) NOT NULL,
        "fortnight_start"    DATE NOT NULL,
        "tax_bracket"        TEXT NOT NULL DEFAULT 'auto',
        "transit_preference" TEXT NOT NULL DEFAULT 'google',
        "workplace_address"  TEXT NOT NULL DEFAULT '793 High Street, Epping VIC 3076',
        "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(`DROP INDEX "idx_shifts_device_date"`);
    await queryRunner.query(`DROP TABLE "shifts"`);
  }
}
