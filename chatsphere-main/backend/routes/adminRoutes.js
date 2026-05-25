import { Router } from 'express';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  adminDashboard,
  adminLogin,
  adminLoginRules,
  approveUser,
  blockUser,
  unblockUser,
  pendingUsers,
  rejectUser
} from '../controllers/adminController.js';

const router = Router();

router.post('/login', adminLoginRules, validateRequest, adminLogin);
router.get('/dashboard', protect, requireAdmin, adminDashboard);
router.get('/pending-users', protect, requireAdmin, pendingUsers);
router.patch('/approve/:id', protect, requireAdmin, approveUser);
router.patch('/reject/:id', protect, requireAdmin, rejectUser);
router.patch('/block/:id', protect, requireAdmin, blockUser);
router.patch('/unblock/:id', protect, requireAdmin, unblockUser);

export default router;
