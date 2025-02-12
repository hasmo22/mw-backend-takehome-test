import axios from 'axios';
import fp from 'fastify-plugin';
import { performance } from 'perf_hooks';

import { ValuationResponse } from './types/valuation-response';
import { ValuationProviderInterface } from '@app/services/valuation-provider-interface';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';
import { LoggingService } from '../logging-service';

export class SuperCarValuationProvider implements ValuationProviderInterface {

  private baseUrl = 'https://run.mocky.io/v3/c9263dc3-e30f-4327-8005-5f71f57a72c8';
  private providerName: string = 'SuperCar Valuations';
  private loggingService;

  constructor(loggingService: LoggingService) {
    this.loggingService = loggingService;    
  }

  /**
   * Values a car based on vrm and mileage using the Super Car Valuation company
   * 
   * @param vrm 
   * @param mileage 
   * @returns Promise<ValuationResponse> 
   */
  async getValuation(vrm: string, mileage: number): Promise<VehicleValuation> {
    axios.defaults.baseURL = this.baseUrl;
    const start = performance.now();

    try {
      const response = await axios.get<ValuationResponse>(
        `valuations/${vrm}?mileage=${mileage}`,
      );

      // Grab duration for this request
      const duration = performance.now() - start;

      const valuation = new VehicleValuation();

      valuation.vrm = vrm;
      valuation.lowestValue = response.data.valuation.lowerValue;
      valuation.highestValue = response.data.valuation.upperValue;
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

      throw new ServiceUnavailableError(`Unable to retrieve valuation from ${this.providerName}`);
    }
  }
}

export default fp(async function (fastify) {
  const loggingService = fastify.loggingService as LoggingService;
  fastify.decorate('superCarValuationProvider', new SuperCarValuationProvider(loggingService));
});