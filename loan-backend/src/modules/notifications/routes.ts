import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import { list, markRead } from './controller';

const router = Router();

router.get('/', authenticate, list);
router.post('/read', authenticate, markRead);

export default router;
