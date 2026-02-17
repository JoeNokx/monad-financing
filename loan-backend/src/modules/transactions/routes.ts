import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import { list } from './controller';

const router = Router();

router.get('/', authenticate, list);

export default router;
