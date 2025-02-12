import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ProviderLogs {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 7 })
    vrm: string;

    @CreateDateColumn()
    requestDateTime: Date;

    // req. duration in milliseconds
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    requestDuration: number;

    @Column()
    requestUrl: string;

    @Column({ nullable: true })
    responseCode: number;

    @Column({ nullable: true })
    errorMessage?: string;

    @Column({ length: 255 })
    providerName: string;
}
