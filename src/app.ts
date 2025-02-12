import './env';
import 'reflect-metadata';

import { fastify as Fastify, FastifyServerOptions } from 'fastify';
import { valuationRoutes } from './routes/valuation';

import databaseConnection from 'typeorm-fastify-plugin';
import { VehicleValuation } from './models/vehicle-valuation';
import { ProviderLogs } from './models/provider-logs';
import SuperCarValuationProvider from './services/super-car/super-car-valuation-provider';
import PremiumCarValuationProvider from './services/premium-car/premium-car-valuation-provider';
import ValuationService from './services/valuation-service';
import LoggingService from './services/logging-service';

export const app = (opts?: FastifyServerOptions) => {
  const fastify = Fastify(opts);
  fastify
    .register(databaseConnection, {
      type: 'sqlite',
      database: process.env.DATABASE_PATH!,
      synchronize: process.env.SYNC_DATABASE === 'true',
      logging: false,
      entities: [VehicleValuation, ProviderLogs],
      migrations: [],
      subscribers: [],
    })
    .ready();

  fastify.register(LoggingService);
  fastify.register(SuperCarValuationProvider);
  fastify.register(PremiumCarValuationProvider);
  fastify.register(ValuationService);

  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  valuationRoutes(fastify);

  return fastify;
};
