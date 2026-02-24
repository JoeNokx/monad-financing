import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import { getSummary } from './controller';

const router = Router();

router.get('/summary', authenticate, getSummary);

export default router;
