import { Repository } from 'typeorm';
import { ProviderLogs } from '@app/models/provider-logs';
import fp from 'fastify-plugin';

export class LoggingService {
  private providerLogsRepository: Repository<ProviderLogs>;

  constructor(providerLogsRepository: Repository<ProviderLogs>) {
    this.providerLogsRepository = providerLogsRepository;
  }

  /**
   * Log provider request details.
   * 
   * @param vrm The vehicle registration mark
   * @param requestUrl Request URL
   * @param providerName Valuation provider name
   * @param requestDuration Request duration in ms
   * @param responseCode HTTP response code
   * @param errorMessage Error message (if applicable)
   */
  async logProviderRequest(
    vrm: string,
    requestUrl: string,
    providerName: string,
    requestDuration: number,
    responseCode: number,
    errorMessage?: string
  ): Promise<void> {
    const logEntry = this.providerLogsRepository.create({
      vrm,
      requestDateTime: new Date(),
      requestDuration,
      requestUrl,
      providerName,
      responseCode,
      errorMessage,
    });

    await this.providerLogsRepository.save(logEntry);
  }
}

export default fp(async function (fastify) {
  const providerLogsRepository = fastify.orm.getRepository(ProviderLogs);
  fastify.decorate('loggingService', new LoggingService(providerLogsRepository));
});
