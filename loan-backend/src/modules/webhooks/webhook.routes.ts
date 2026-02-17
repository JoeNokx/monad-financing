import { Router } from 'express';

import { handlePaystackWebhook } from './paystack.webhook';
import { handleSmileWebhook } from './smile.webhook';

const router = Router();

router.post('/paystack', handlePaystackWebhook);
router.post('/smile', handleSmileWebhook);

export default router;
