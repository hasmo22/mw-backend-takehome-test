import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchemaMigration1739368408879 implements MigrationInterface {
    name = 'InitialSchemaMigration1739368408879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "provider_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "vrm" varchar(7) NOT NULL, "requestDateTime" datetime NOT NULL DEFAULT (datetime('now')), "requestDuration" decimal(10,2) NOT NULL, "requestUrl" varchar NOT NULL, "responseCode" integer, "errorMessage" varchar, "providerName" varchar(255) NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "provider_logs"`);
    }

}
