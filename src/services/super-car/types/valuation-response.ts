import { Plate } from './plate';
import { Valuation } from './valuation';

export type ValuationResponse = {
  vin: string;
  registrationDate: string;
  plate: Plate;
  valuation: Valuation;
};
