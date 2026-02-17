import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { status, submit } from './controller';
import { submitKycSchema } from './validator';

const router = Router();

router.get('/status', authenticate, status);
router.post('/submit', authenticate, validateRequest(submitKycSchema), submit);

export default router;
