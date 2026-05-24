import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { addMembers, createGroup, getGroups, leaveGroup, removeMember, updateGroup } from '../controllers/groupController.js';

const router = Router();

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.put('/:groupId', protect, updateGroup);
router.post('/:groupId/members', protect, addMembers);
router.delete('/:groupId/members/:userId', protect, removeMember);
router.post('/:groupId/leave', protect, leaveGroup);

export default router;