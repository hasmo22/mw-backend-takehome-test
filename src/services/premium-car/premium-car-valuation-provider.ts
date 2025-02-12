import axios from 'axios';
import fp from 'fastify-plugin';
import { XMLParser } from 'fast-xml-parser';
import { performance } from 'perf_hooks';

import { ValuationProviderInterface } from '@app/services/valuation-provider-interface';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ValuationResponse } from './types/valuation-response';
import { LoggingService } from '../logging-service';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';

export class PremiumCarValuationProvider implements ValuationProviderInterface {

    private baseUrl = 'https://run.mocky.io/v3/a4459abe-a6c3-457f-acf8-c31bf295cae6';
    private parser: XMLParser;
    private providerName: string = 'Premium Car Valuations';
    private loggingService: LoggingService;

    constructor(loggingService: LoggingService) {
        this.loggingService = loggingService;
        this.parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true
        });
    }

    /**
     * Values a car based on vrm and mileage using the PremiumCar Valuation company
     * 
     * @param vrm 
     * @param mileage 
     * @returns Promise<VehicleValuation> 
     */
    async getValuation(vrm: string): Promise<VehicleValuation> {
        axios.defaults.baseURL = this.baseUrl;
        const start = performance.now();

        try {
            const response = await axios.get<string>(`valuations/${vrm}`, {
                responseType: 'text',
            });

            // Grab duration for this request
            const duration = performance.now() - start;

            const parsedData = this.parser.parse(response.data);
            const data: ValuationResponse = parsedData.Response;

            const valuation = new VehicleValuation();

            valuation.vrm = vrm;
            valuation.lowestValue = data.ValuationPrivateSaleMinimum;
            valuation.highestValue = data.ValuationPrivateSaleMaximum;
            valuation.providerName = this.providerName;

            await this.loggingService.logProviderRequest(
                vrm,
                this.baseUrl,
                this.providerName,
                duration,
                200
            );

            return valuation;
        } catch (error: unknown) {
            const duration = performance.now() - start;
            let responseCode = 500;
            let errorMessage = `Unable to retrieve valuation from ${this.providerName}`;
      
            if (axios.isAxiosError(error)) {
              responseCode = error.response?.status ?? 500;
              errorMessage = error.message ?? `Unable to retrieve valuation from ${this.providerName}`;
            }

            await this.loggingService.logProviderRequest(
                vrm,
                this.baseUrl,
                this.providerName,
                duration,
                responseCode,
                errorMessage
            );

            throw ServiceUnavailableError();
        }
    }
}

export default fp(async function (fastify) {
    const loggingService = fastify.loggingService as LoggingService;
    fastify.decorate('premiumCarValuationProvider', new PremiumCarValuationProvider(loggingService));
});