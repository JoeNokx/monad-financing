import { Router } from 'express';
import multer from 'multer';

import authenticate from '../../middleware/authenticate';
import validateRequest from '../../middleware/validateRequest';
import ApiError from '../../common/errors/ApiError';
import { status, submit, submitFiles } from './controller';
import { submitKycFilesSchema, submitKycSchema } from './validator';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 7 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new ApiError('Only image uploads are allowed', { statusCode: 400, code: 'INVALID_FILE_TYPE' }));
    }
    cb(null, true);
  },
});

router.get('/status', authenticate, status);
router.post('/submit', authenticate, validateRequest(submitKycSchema), submit);
router.post(
  '/submit-files',
  authenticate,
  upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  validateRequest(submitKycFilesSchema),
  submitFiles,
);

export default router;
