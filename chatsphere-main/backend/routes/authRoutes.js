import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { validateRequest } from '../middleware/validate.js';
import { login, loginRules, logout, me, register, registerRules } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', upload.single('avatar'), registerRules, validateRequest, register);
router.post('/login', loginRules, validateRequest, login);
router.get('/me', protect, me);
router.post('/logout', protect, logout);

export default router;