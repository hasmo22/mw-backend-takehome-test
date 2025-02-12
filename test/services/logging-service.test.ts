import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { LoggingService } from '@app/services/logging-service';
import { ProviderLogs } from '@app/models/provider-logs';

describe('LoggingService', () => {
    let loggingService: LoggingService;
    let mockRepository: Repository<ProviderLogs> & {
        create: vi.MockInstance<[any], ProviderLogs>;
        save: vi.MockInstance<[ProviderLogs], Promise<ProviderLogs>>;
    };

    beforeEach(() => {
        vi.useFakeTimers();
        const mockDate = new Date('2025-02-12T12:00:00Z');
        vi.setSystemTime(mockDate);

        mockRepository = {
            create: vi.fn().mockImplementation((data) => ({
                ...data,
            })),
            save: vi.fn().mockImplementation((data) => Promise.resolve(data))
        } as unknown as Repository<ProviderLogs> & {
            create: vi.MockInstance<[any], ProviderLogs>;
            save: vi.MockInstance<[ProviderLogs], Promise<ProviderLogs>>;
        };

        loggingService = new LoggingService(mockRepository);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('logProviderRequest', () => {
        it('should create and save a log entry for successful request', async () => {
            const testData = {
                vrm: '12345',
                requestUrl: 'https://hass-fake-valuation-company',
                providerName: 'Hass SuperCar Valuations',
                requestDuration: 150,
                responseCode: 200
            };

            await loggingService.logProviderRequest(
                testData.vrm,
                testData.requestUrl,
                testData.providerName,
                testData.requestDuration,
                testData.responseCode
            );

            expect(mockRepository.create).toHaveBeenCalledWith({
                vrm: testData.vrm,
                requestDateTime: new Date('2025-02-12T12:00:00Z'),
                requestDuration: testData.requestDuration,
                requestUrl: testData.requestUrl,
                providerName: testData.providerName,
                responseCode: testData.responseCode,
                errorMessage: undefined
            });

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should create and save a log entry with error message', async () => {
            const testData = {
                vrm: '12345',
                requestUrl: 'https://jedi-valuation-company',
                providerName: 'Luke Im Your Father Valuations',
                requestDuration: 150,
                responseCode: 500,
                errorMessage: 'Service Unavailable'
            };

            await loggingService.logProviderRequest(
                testData.vrm,
                testData.requestUrl,
                testData.providerName,
                testData.requestDuration,
                testData.responseCode,
                testData.errorMessage
            );

            expect(mockRepository.create).toHaveBeenCalledWith({
                vrm: testData.vrm,
                requestDateTime: new Date('2025-02-12T12:00:00Z'),
                requestDuration: testData.requestDuration,
                requestUrl: testData.requestUrl,
                providerName: testData.providerName,
                responseCode: testData.responseCode,
                errorMessage: testData.errorMessage
            });

            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should handle repository save errors', async () => {
            const testData = {
                vrm: '12345',
                requestUrl: 'https://porsche-valuation-company',
                providerName: 'Porsche Valuations',
                requestDuration: 150,
                responseCode: 200
            };

            mockRepository.save.mockRejectedValueOnce(new Error('Database error'));

            await expect(loggingService.logProviderRequest(
                testData.vrm,
                testData.requestUrl,
                testData.providerName,
                testData.requestDuration,
                testData.responseCode
            )).rejects.toThrow('Database error');
        });
    });
});