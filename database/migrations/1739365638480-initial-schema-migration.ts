import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchemaMigration1739365638480 implements MigrationInterface {
    name = 'InitialSchemaMigration1739365638480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicle_valuation" ("vrm" varchar(7) PRIMARY KEY NOT NULL, "lowestValue" decimal(10,2) NOT NULL, "highestValue" decimal(10,2) NOT NULL, "providerName" varchar(255))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicle_valuation"`);
    }

}
