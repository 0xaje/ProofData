import { Router } from 'express';
import multer from 'multer';
import * as datasetController from '../controllers/dataset.controller';
import { requirePayment } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('dataset'), datasetController.uploadDataset);
router.post('/:id/pay', datasetController.payForDataset);
router.get('/:id/verify', datasetController.verifyDataset);
router.get('/:id', requirePayment, datasetController.getDataset);

export default router;
