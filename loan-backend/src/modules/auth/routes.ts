import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import { session } from './controller';

const router = Router();

router.get('/session', authenticate, session);

export default router;
