import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { approveUser, blockUser, listUsers, setPendingUser } from '../controllers/adminController.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/users', listUsers);
router.put('/user/:id/approve', approveUser);
router.put('/user/:id/block', blockUser);
router.put('/user/:id/pending', setPendingUser);

export default router;
