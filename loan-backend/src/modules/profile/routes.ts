import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { getMyProfile, upsertMyProfile } from './controller';
import { upsertProfileSchema } from './validator';

const router = Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, validateRequest(upsertProfileSchema), upsertMyProfile);

export default router;
