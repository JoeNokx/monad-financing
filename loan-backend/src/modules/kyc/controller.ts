import type { RequestHandler } from 'express';

import ApiError from '../../common/errors/ApiError';
import { uploadKycImage } from '../../config/cloudinary';
import { getKycStatus, submitKyc } from './service';

export const submit: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const kyc = await submitKyc(req.currentUser.id, req.body);
    res.json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
};

export const status: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const result = await getKycStatus(req.currentUser.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const submitFiles: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const files = (req as any).files as
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | undefined;

    const idFront = files?.idFront?.[0];
    const idBack = files?.idBack?.[0];
    const selfie = files?.selfie?.[0];

    if (!idFront || !idBack || !selfie) {
      throw new ApiError('Missing required files: idFront, idBack, selfie', { statusCode: 400, code: 'MISSING_FILES' });
    }

    const userId = req.currentUser.id;

    const [frontResult, backResult, selfieResult] = await Promise.all([
      uploadKycImage({ userId, kind: 'id_front', buffer: idFront.buffer, mimetype: idFront.mimetype }),
      uploadKycImage({ userId, kind: 'id_back', buffer: idBack.buffer, mimetype: idBack.mimetype }),
      uploadKycImage({ userId, kind: 'selfie', buffer: selfie.buffer, mimetype: selfie.mimetype }),
    ]);

    const kyc = await submitKyc(userId, {
      idType: (req.body as any).idType,
      idNumber: (req.body as any).idNumber,
      idImageUrl: frontResult.url,
      idBackImageUrl: backResult.url,
      selfieUrl: selfieResult.url,
    });

    res.json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
};
