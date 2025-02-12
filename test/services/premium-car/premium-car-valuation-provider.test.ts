import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { PremiumCarValuationProvider } from '@app/services/premium-car/premium-car-valuation-provider';
import { LoggingService } from '@app/services/logging-service';
import { VehicleValuation } from '@app/models/vehicle-valuation';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
    get: vi.Mock;
    isAxiosError: vi.Mock;
    defaults: {
        baseURL: string;
    };
};

describe('PremiumCarValuationProvider', () => {
    let provider: PremiumCarValuationProvider;
    let mockLoggingService: LoggingService;

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Create mock for LoggingService
        mockLoggingService = {
            logProviderRequest: vi.fn().mockResolvedValue(undefined)
        } as unknown as LoggingService;

        // Initialise provider with mock logging service
        provider = new PremiumCarValuationProvider(mockLoggingService);
    });

    describe('getValuation', () => {
        it('should successfully return a vehicle valuation', async () => {
            
          // Mock XML
            const mockXmlResponse = `
                <?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <ValuationPrivateSaleMinimum>5000</ValuationPrivateSaleMinimum>
                    <ValuationPrivateSaleMaximum>7000</ValuationPrivateSaleMaximum>
                </Response>
            `;

            // Setup axios mock
            mockedAxios.get.mockResolvedValueOnce({
                data: mockXmlResponse,
                status: 200
            });

            const testVrm = 'testvrm1';
            const result = await provider.getValuation(testVrm);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `valuations/${testVrm}`,
                { responseType: 'text' }
            );

            expect(result).toBeInstanceOf(VehicleValuation);
            expect(result.vrm).toBe(testVrm);
            expect(result.lowestValue).toBe(5000);
            expect(result.highestValue).toBe(7000);
            expect(result.providerName).toBe('Premium Car Valuations');

            expect(mockLoggingService.logProviderRequest).toHaveBeenCalledWith(
                testVrm,
                expect.any(String),
                'Premium Car Valuations',
                expect.any(Number),
                200
            );
        });
    });

    it('should handle axios error and throw ServiceUnavailableError', async () => {
      // Test data
      const testVrm = 'AB12CDE';
      const errorMessage = 'Network Error';
      const statusCode = 503;
      
      // Create a proper Axios error
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

      await expect(provider.getValuation(testVrm)).rejects.toThrow();

      // Verify logging service was called with error details
      expect(mockLoggingService.logProviderRequest).toHaveBeenCalledWith(
          testVrm,
          'https://run.mocky.io/v3/a4459abe-a6c3-457f-acf8-c31bf295cae6',
          'Premium Car Valuations',
          expect.any(Number),
          statusCode,
          errorMessage
      );
  });
});