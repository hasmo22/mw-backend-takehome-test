import 'fastify';
import { SuperCarValuationProvider } from '@app/services/super-car-valuation-provider';
import { ValuationService } from '@app/services/valuation-service';
import { PremiumCarValuationProvider } from '@app/services/premium-car/premium-car-valuation-provider';
import { DataSource } from 'typeorm';
import { LoggingService } from '@app/services/logging-service';

declare module 'fastify' {
  interface FastifyInstance {
    loggingService: LoggingService
    superCarValuationProvider: SuperCarValuationProvider;
    premiumCarValuationProvider: PremiumCarValuationProvider;
    valuationService: ValuationService;
    orm: DataSource;
  }
}
