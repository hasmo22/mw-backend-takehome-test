import fp from 'fastify-plugin';
import { SuperCarValuationProvider } from '@app/services/super-car/super-car-valuation-provider';
import { PremiumCarValuationProvider } from './premium-car/premium-car-valuation-provider';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { Repository } from 'typeorm';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';
import { DatabaseSaveError } from '@app/errors/database-save-error';

export class ValuationService {

    private supercarValuationProvider;
    private premiumcarValuationProvider;
    private valuationRepository;

    /**
     * 50% failure threshold
     */
    private failoverThreshold = 0.5;
    private failureQueue: boolean[] = [];
    private maxFailures = 50;

    private isInFailoverMode = false;
    private failoverTimeoutMs = 5 * 60 * 1000;
    private failoverTimer: NodeJS.Timeout | null = null;

    constructor(
        supercarProvider: SuperCarValuationProvider,
        premiumcarProvider: PremiumCarValuationProvider,
        valuationRepository: Repository<VehicleValuation>
    ) {
        this.supercarValuationProvider = supercarProvider;
        this.premiumcarValuationProvider = premiumcarProvider;
        this.valuationRepository = valuationRepository;
    }

    /**
     * Get valuation for vehicle.
     * 
     * @param vrm 
     * @param mileage 
     * @returns Promise<VehicleValuation> 
     */
    async getValuation(vrm: string, mileage: number): Promise<VehicleValuation> {
        // Check for existing valuation and return
        const existingValuation = await this.valuationRepository.findOneBy({ vrm });
        if (existingValuation) {
            return existingValuation;
        }

        if (this.shouldFailover()) {
            console.warn('Failover to Premium Car Valuation Provider...');
            this.enterFailoverMode();
            return this.getValuationFromFallbackProvider(vrm);
        }

        try {
            const valuation = await this.supercarValuationProvider.getValuation(vrm, mileage);
            this.trackFailure(true);

            // Save to db.
            await this.saveValuationToDB(valuation);

            return valuation;
        } catch (error) {
            this.trackFailure(false);

            if (this.shouldFailover()) {
                console.warn('Failing over to Premium Car Valuation Provider...');
                this.enterFailoverMode();
                return this.getValuationFromFallbackProvider(vrm);
            }

            throw error;
        }
    }

    /**
     * Call backup valuation provider.
     * 
     * @param providerCall 
     * @returns Promise<VehicleValuation>
     */
    private async getValuationFromFallbackProvider(vrm: string): Promise<VehicleValuation> {
        try {
            const valuation = await this.premiumcarValuationProvider.getValuation(vrm)
            await this.saveValuationToDB(valuation);
            return valuation;
        } catch (error) {
            console.error('Both valuation providers are currently unavailable...');
            throw new ServiceUnavailableError();
        }
    }

    /**
     * Save valuation to db.
     * 
     * @param valuation: VehicleValuation
     */
    private async saveValuationToDB(valuation: VehicleValuation) {
        try {
            await this.valuationRepository.insert(valuation).catch((err) => {
                if (err.code !== 'SQLITE_CONSTRAINT') {
                    throw err;
                }
            });
        } catch (error) {
            throw new DatabaseSaveError();
        }
    }

    /**
     * Track failure of requests. Boolean passed in for success/failure respectively.
     * 
     * @param success 
     * @returns number
     */
    private trackFailure(success: boolean): number {
        if (this.failureQueue.length >= this.maxFailures) {
            this.failureQueue.shift();
        }
        this.failureQueue.push(success);

        // Calculate failure rate
        const failureCount = this.failureQueue.filter(f => !f).length;
        return failureCount / this.failureQueue.length;
    }

    /**
     * Check if we should failover to backup valuation provider
     * by checking against a failure threshold of 50%.
     * 
     * @returns boolean
     */
    private shouldFailover(): boolean {
        if (this.failureQueue.length < this.maxFailures) {
            return false;
        }
    
        // Calculate failure rate correctly
        const failureRate = this.failureQueue.filter(f => !f).length / this.failureQueue.length;    
        return failureRate > this.failoverThreshold;
    }

    /**
     * Flag failover mode for 5mins
     */
    private enterFailoverMode() {
        // check if we're in failover mode already, if so, return
        if (this.isInFailoverMode) return;
        this.isInFailoverMode = true;

        // Go into failover mode for 5mins, fresh queue.
        this.failoverTimer = setTimeout(() => {
            this.isInFailoverMode = false;
            this.failureQueue = [];
        }, this.failoverTimeoutMs);
    }
}

export default fp(async function (fastify) {
    const supercarProvider = fastify.superCarValuationProvider as SuperCarValuationProvider;
    const premiumcarProvider = fastify.premiumCarValuationProvider as PremiumCarValuationProvider;
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    fastify.decorate('valuationService', new ValuationService(supercarProvider, premiumcarProvider, valuationRepository));
});
