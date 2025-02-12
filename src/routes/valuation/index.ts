import { FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import { formatValuationResponse } from '@app/utils/format-valuation-response';

import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ValuationService } from '@app/services/valuation-service';

export function valuationRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;

    if (vrm === null || vrm === '' || vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    // Attempt to retrieve valuation
    const valuation = await valuationRepository.findOneBy({ vrm: vrm });

    if (valuation == null) {
      return reply
        .code(404)
        .send({
          message: `Valuation for VRM ${vrm} not found`,
          statusCode: 404,
        });
    }

    const response = formatValuationResponse(valuation);
    return reply
      .code(200)
      .send({
        statusCode: 200,
        data: response,
      });
  });

  fastify.put<{
    Body: VehicleValuationRequest;
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const { vrm } = request.params;
    const { mileage } = request.body;

    if (vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    if (mileage === null || mileage <= 0) {
      return reply
        .code(400)
        .send({
          message: 'mileage must be a positive number',
          statusCode: 400,
        });
    }

    // Get valuation service
    const valuationService = fastify.valuationService as ValuationService;
    const valuation = await valuationService.getValuation(vrm, mileage);
    const response = formatValuationResponse(valuation);

    fastify.log.info('Valuation created: ', response);

    return reply
      .code(200)
      .send({
        message: `Valuation successfully created`,
        statusCode: 200,
        data: response,
      });
  });
}
