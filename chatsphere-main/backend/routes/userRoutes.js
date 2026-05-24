import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { blockUser, changePassword, deleteAccount, getProfile, searchUsers, updateProfile, listUsers } from '../controllers/userController.js';

const router = Router();

router.get('/me', protect, getProfile);
router.get('/', protect, listUsers);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.put('/password', protect, changePassword);
router.get('/search', protect, searchUsers);
router.post('/block/:userId', protect, blockUser);
router.delete('/me', protect, deleteAccount);

export default router;