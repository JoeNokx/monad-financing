import { Router } from 'express';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import { apply, getOne, list, products, quote, repay } from './controller';
import { applyLoanSchema, quoteLoanSchema, repayLoanSchema } from './validator';

const router = Router();

router.get('/', authenticate, list);
router.get('/products', authenticate, products);
router.get('/:loanId', authenticate, getOne);
router.post('/quote', authenticate, validateRequest(quoteLoanSchema), quote);
router.post('/apply', authenticate, validateRequest(applyLoanSchema), apply);
router.post('/:loanId/repay', authenticate, validateRequest(repayLoanSchema), repay);

export default router;

