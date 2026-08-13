import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { SearchQueryDto } from './search.schema';
import { paginated, ok } from '../../common/utils/response';

export class SearchController {
  private readonly service = new SearchService();

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.query as unknown as SearchQueryDto;
      const result = await this.service.search(dto);
      paginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  };

  suggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const destination = (req.query.q as string) ?? '';
      const cities = await this.service.suggestions(destination);
      ok(res, cities);
    } catch (error) {
      next(error);
    }
  };

  destinationCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.destinationCounts();
      ok(res, data);
    } catch (error) {
      next(error);
    }
  };
}
