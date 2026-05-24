import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { deleteMessage, editMessage, getMessages, sendMessage } from '../controllers/messageController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/:chatId', protect, getMessages);
router.post('/', protect, upload.array('files', 10), sendMessage);
router.patch('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);

export default router;