import { SearchRepository } from './search.repository';
import { SearchQueryDto } from './search.schema';
import { AppError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

export class SearchService {
  private readonly repo = new SearchRepository();

  async search(dto: SearchQueryDto) {
    try {
      const { data, total } = await this.repo.search(dto);
      return { data, total, page: dto.page, limit: dto.limit };
    } catch (error) {
      logger.error('Search failed', { error, destination: dto.destination });
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'SEARCH_FAILED', 'Search failed');
    }
  }

  async suggestions(destination: string): Promise<string[]> {
    try {
      return await this.repo.suggestions(destination);
    } catch (error) {
      logger.error('Suggestions failed', { error, destination });
      return [];
    }
  }

  async destinationCounts(): Promise<{ city: string; count: number }[]> {
    try {
      return await this.repo.destinationCounts();
    } catch (error) {
      logger.error('Destination counts failed', { error });
      return [];
    }
  }
}
