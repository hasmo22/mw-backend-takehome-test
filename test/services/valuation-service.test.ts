import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ValuationService } from '@app/services/valuation-service';
import { SuperCarValuationProvider } from '@app/services/super-car/super-car-valuation-provider';
import { PremiumCarValuationProvider } from '@app/services/premium-car/premium-car-valuation-provider';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';
import { DatabaseSaveError } from '@app/errors/database-save-error';

describe('ValuationService', () => {
    let valuationService: ValuationService;
    let mockSuperCarProvider: SuperCarValuationProvider;
    let mockPremiumCarProvider: PremiumCarValuationProvider;
    let mockRepository: Repository<VehicleValuation>;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Create mock dependencies
        mockSuperCarProvider = {
            getValuation: vi.fn()
        } as unknown as SuperCarValuationProvider;

        mockPremiumCarProvider = {
            getValuation: vi.fn()
        } as unknown as PremiumCarValuationProvider;

        mockRepository = {
            findOneBy: vi.fn().mockImplementation(() => Promise.resolve(null)),
            insert: vi.fn().mockImplementation(() => Promise.resolve())
        } as unknown as Repository<VehicleValuation> & {
            findOneBy: vi.MockInstance<[FindOptionsWhere<VehicleValuation>], Promise<VehicleValuation | null>>;
            insert: vi.MockInstance<[VehicleValuation], Promise<void>>;
        };

        valuationService = new ValuationService(
            mockSuperCarProvider,
            mockPremiumCarProvider,
            mockRepository
        );
    });

    describe('getValuation', () => {
        it('should return existing valuation if found in repository', async () => {
            const existingValuation = new VehicleValuation();
            existingValuation.vrm = '12345';
            existingValuation.lowestValue = 5000;
            existingValuation.highestValue = 7000;

            mockRepository.findOneBy.mockResolvedValueOnce(existingValuation);

            const result = await valuationService.getValuation('12345', 50000);

            expect(result).toBe(existingValuation);
            expect(mockRepository.findOneBy).toHaveBeenCalledWith({ vrm: '12345' });
            expect(mockSuperCarProvider.getValuation).not.toHaveBeenCalled();
            expect(mockPremiumCarProvider.getValuation).not.toHaveBeenCalled();
        });

        it('should get valuation from SuperCar provider and save to db', async () => {
            const valuation = new VehicleValuation();
            valuation.vrm = '23456';
            valuation.lowestValue = 5000;
            valuation.highestValue = 7000;
            const mileage = 50000;

            mockRepository.findOneBy.mockResolvedValueOnce(null);
            mockSuperCarProvider.getValuation.mockResolvedValueOnce(valuation);
            mockRepository.insert.mockResolvedValueOnce(undefined);

            const result = await valuationService.getValuation('23456', mileage);

            expect(result).toBe(valuation);
            expect(mockSuperCarProvider.getValuation).toHaveBeenCalledWith('23456', mileage);
            expect(mockRepository.insert).toHaveBeenCalledWith(valuation);
        });

        it('should failover to PremiumCar provider after multiple SuperCar failures', async () => {
            const valuation = new VehicleValuation();
            valuation.vrm = '23456';
            
            mockRepository.findOneBy.mockResolvedValue(null);
            mockSuperCarProvider.getValuation.mockRejectedValue(new Error('Service unavailable'));
            mockPremiumCarProvider.getValuation.mockResolvedValue(valuation);

            // Simulate failures to trigger failover
            for (let i = 0; i < 51; i++) {
                try {
                    await valuationService.getValuation('23456', 50000);
                } catch (error) {
                    // Expected errors for first 50 calls
                }
            }

            const result = await valuationService.getValuation('23456', 50000);

            expect(result).toBe(valuation);
            // Should've failed over to premium car instead of supercar provider
            expect(mockPremiumCarProvider.getValuation).toHaveBeenCalledWith('23456');
        });

        it('should throw ServiceUnavailableError when both providers fail', async () => {
            mockRepository.findOneBy.mockResolvedValue(null);
            mockSuperCarProvider.getValuation.mockRejectedValue(new Error('Service unavailable'));
            mockPremiumCarProvider.getValuation.mockRejectedValue(new Error('Service unavailable'));

            // Simulate failover and then throw service unavailable on premium car provider
            for (let i = 0; i < 51; i++) {
                try {
                    await valuationService.getValuation('12345', 50000);
                } catch (error) {
                    // Expected errors for first 50 calls
                }
            }

            await expect(valuationService.getValuation('12345', 50000))
                .rejects
                .toThrow(ServiceUnavailableError);
        });

        it('should throw DatabaseSaveError when DB insert fails', async () => {
            const valuation = new VehicleValuation();
            valuation.vrm = '12345';

            mockRepository.findOneBy.mockResolvedValueOnce(null);
            mockSuperCarProvider.getValuation.mockResolvedValueOnce(valuation);
            mockRepository.insert.mockRejectedValueOnce(new Error('DB Error'));

            await expect(valuationService.getValuation('12345', 50000))
                .rejects
                .toThrow(DatabaseSaveError);
        });
    });
});