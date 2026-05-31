import express from 'express';
import { User } from '../models/index.js';

const router = express.Router();

// Dev-only endpoint to approve all pending/blocked users for E2E testing
const approveAllHandler = async (req, res) => {
  try {
    const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
    if (nodeEnv === 'production') {
      return res.status(403).json({ success: false, message: 'Not allowed in production' });
    }

    const [updated] = await User.update({ status: 'approved' }, { where: { status: ['pending', 'blocked'] } });
    return res.json({ success: true, updated });
  } catch (err) {
    console.error('[debug][approve-all] error', err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed' });
  }
};

router.post('/approve-all', approveAllHandler);
router.get('/approve-all', approveAllHandler);
 
export default router;
