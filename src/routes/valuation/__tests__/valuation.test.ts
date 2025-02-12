import { fastify } from '~root/test/fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';
import { describe, expect, it } from 'vitest';

describe('ValuationController (e2e)', () => {
  describe('GET /valuations/', () => {
    it('should return 404 if valuation doesn\'t exist for vrm', async () => {
      const res = await fastify.inject({
        url: '/valuations/111',
        method: 'GET'
      });

      expect(res.statusCode).toStrictEqual(404);
    }),
    it('should return 400 if the vrm is invalid', async () => {
      const res = await fastify.inject({
        url: '/valuations/',
        method: 'GET'
      });

      expect(res.statusCode).toStrictEqual(400);
    }),
    it('should return 400 if the vrm is too long', async () => {
      const res = await fastify.inject({
        url: '/valuations/1234567890',
        method: 'GET'
      });

      expect(res.statusCode).toStrictEqual(400);
    })
  }),
  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };
    
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(res.json()).toMatchObject({
        message: 'Valuation successfully created',
        statusCode: 200,
        data: expect.any(Object),
      });
    });    
  });
});
