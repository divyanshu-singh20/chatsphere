import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { deleteMessage, editMessage, getMessages, markSeen, reactToMessage, sendMessage } from '../controllers/messageController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/:chatId', protect, getMessages);
router.patch('/:chatId/seen', protect, markSeen);
router.post('/', protect, upload.array('files', 10), sendMessage);
router.patch('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/reactions', protect, reactToMessage);

export default router;