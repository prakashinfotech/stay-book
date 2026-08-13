import { Router } from 'express';
import { validateQuery } from '../../common/middleware/validate.middleware';
import { searchQuerySchema } from './search.schema';
import { SearchController } from './search.controller';

const router = Router();
const controller = new SearchController();

router.get('/destinations', controller.destinationCounts);
router.get('/', validateQuery(searchQuerySchema), controller.search);
router.get('/suggestions', controller.suggestions);

export { router as searchRouter };
