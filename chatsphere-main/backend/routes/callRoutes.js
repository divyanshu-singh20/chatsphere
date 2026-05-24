import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getCalls, startCall, updateCall } from '../controllers/callController.js';

const router = Router();

router.get('/', protect, getCalls);
router.post('/', protect, startCall);
router.patch('/:callId', protect, updateCall);

export default router;