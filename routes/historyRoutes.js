import express from 'express';
import HistoryController from '../controllers/historyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', HistoryController.getAllHistory);
router.put('/', authenticate, HistoryController.updateHistory);

export default router;