import { VehicleValuation } from "@app/models/vehicle-valuation";

export interface ValuationProviderInterface {
    getValuation(vrm: string, mileage?: number): Promise<VehicleValuation>;
}
