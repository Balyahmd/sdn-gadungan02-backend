import express from 'express';
import VisimisiController from '../controllers/visimisiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', VisimisiController.getVisiMisi);
router.put('/', authenticate, VisimisiController.updateVisiMisi);

export default router;