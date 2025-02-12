import createError from '@fastify/error';

export const ServiceUnavailableError = createError(
  'SERVICE_UNAVAILABLE',
  'Valuation providers are currently unreachable.',
  503
);
