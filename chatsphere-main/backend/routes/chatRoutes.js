import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { addChatMember, createDirectChat, createGroupChat, getChats, leaveGroup, removeChatMember } from '../controllers/chatController.js';

const router = Router();

router.get('/', protect, getChats);
router.post('/direct', protect, createDirectChat);
router.post('/group', protect, createGroupChat);
router.post('/:chatId/members', protect, addChatMember);
router.delete('/:chatId/members/:userId', protect, removeChatMember);
router.post('/:chatId/leave', protect, leaveGroup);

export default router;