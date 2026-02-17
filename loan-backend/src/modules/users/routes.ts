import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { me, setUserPin, verifyUserPin } from './controller';
import { setPinSchema, verifyPinSchema } from './validator';

const router = Router();

router.get('/me', authenticate, me);
router.post('/pin', authenticate, validateRequest(setPinSchema), setUserPin);
router.post('/pin/verify', authenticate, validateRequest(verifyPinSchema), verifyUserPin);

export default router;
