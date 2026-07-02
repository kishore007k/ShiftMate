import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersTable1720000000004 implements MigrationInterface {
  name = 'AddUsersTable1720000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"            TEXT NOT NULL,
        "name"             TEXT NOT NULL,
        "provider"         TEXT NOT NULL,
        "provider_user_id" TEXT NOT NULL,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("provider", "provider_user_id")
      )
    `);

    // user_id columns were added nullable in 003; now that users exists, tie them to it.
    // ON DELETE SET NULL: deleting a user unlinks their data rather than deleting shift history.
    await queryRunner.query(`
      ALTER TABLE "shifts" ADD CONSTRAINT "fk_shifts_user"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "user_settings" ADD CONSTRAINT "fk_user_settings_user"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_settings" DROP CONSTRAINT "fk_user_settings_user"`);
    await queryRunner.query(`ALTER TABLE "shifts" DROP CONSTRAINT "fk_shifts_user"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
