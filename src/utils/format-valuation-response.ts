import { VehicleValuationResponse } from '@app/routes/valuation/types/vehicle-valuation-response';
import { VehicleValuation } from '@app/models/vehicle-valuation';

/**
 * Formats a VehicleValuation object into a standardised response.
 * 
 * @param valuation The valuation entity.
 * @returns Formatted VehicleValuationResponse.
 */
export function formatValuationResponse(valuation: VehicleValuation): VehicleValuationResponse {
  return {
    vrm: valuation.vrm,
    lowestValue: valuation.lowestValue,
    highestValue: valuation.highestValue,
    valuationProvider: valuation.providerName 
      ? `Valued by Trusted Company ${valuation.providerName}` 
      : 'Unknown',
  };
}
