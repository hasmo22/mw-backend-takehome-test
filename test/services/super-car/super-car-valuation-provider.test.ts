import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { SuperCarValuationProvider } from '@app/services/super-car/super-car-valuation-provider';
import { LoggingService } from '@app/services/logging-service';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
    get: vi.Mock;
    isAxiosError: vi.Mock;
    defaults: {
        baseURL: string;
    };
};

describe('SuperCarValuationProvider', () => {
    let provider: SuperCarValuationProvider;
    let mockLoggingService: LoggingService;

    beforeEach(() => {
        vi.clearAllMocks();

        mockLoggingService = {
            logProviderRequest: vi.fn().mockResolvedValue(undefined)
        } as unknown as LoggingService;

        provider = new SuperCarValuationProvider(mockLoggingService);
    });

    describe('getValuation', () => {
        it('should successfully return a vehicle valuation', async () => {
            const mockResponse = {
                data: {
                    valuation: {
                        lowerValue: 5000,
                        upperValue: 7000
                    }
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const testVrm = 'vrm1';
            const testMileage = 50000;

            const result = await provider.getValuation(testVrm, testMileage);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `valuations/${testVrm}?mileage=${testMileage}`
            );

            expect(result).toBeInstanceOf(VehicleValuation);
            expect(result.vrm).toBe(testVrm);
            expect(result.lowestValue).toBe(5000);
            expect(result.highestValue).toBe(7000);
            expect(result.providerName).toBe('SuperCar Valuations');

            expect(mockLoggingService.logProviderRequest).toHaveBeenCalledWith(
                testVrm,
                'https://run.mocky.io/v3/c9263dc3-e30f-4327-8005-5f71f57a72c8',
                'SuperCar Valuations',
                expect.any(Number),
                200
            );
        });

        it('should handle axios error and throw ServiceUnavailableError', async () => {
            const testVrm = 'vrm1';
            const testMileage = 50000;
            const errorMessage = 'Network Error';
            const statusCode = 503;

            // mimic an axios error
            const axiosError = {
                message: errorMessage,
                response: {
                    status: statusCode,
                    statusText: 'Service Unavailable',
                    data: {},
                    headers: {},
                    config: {}
                },
                isAxiosError: true,
                toJSON: () => ({}),
                name: 'AxiosError',
                config: {},
                code: 'ERR_NETWORK'
            };

            mockedAxios.isAxiosError.mockReturnValue(true);
            mockedAxios.get.mockRejectedValueOnce(axiosError);

            await expect(provider.getValuation(testVrm, testMileage))
                .rejects
                .toThrow(ServiceUnavailableError);

            expect(mockLoggingService.logProviderRequest).toHaveBeenCalledWith(
                testVrm,
                'https://run.mocky.io/v3/c9263dc3-e30f-4327-8005-5f71f57a72c8',
                'SuperCar Valuations',
                expect.any(Number),
                statusCode,
                errorMessage
            );
        });
    });
});