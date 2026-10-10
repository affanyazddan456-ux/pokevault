// ============================================================
//  PokéVault — Report Routes
// ============================================================

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /api/reports
router.post('/', requireAuth, async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'Target type, ID, and reason are required' });
    }

    const VALID_TYPES = ['card', 'user', 'auction', 'trade'];
    if (!VALID_TYPES.includes(targetType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const report = {
      _id:         uuidv4(),
      reporterId:  req.session.userId,
      targetType,
      targetId,
      reason,
      description: description?.trim() || '',
      status:      'pending',
      createdAt:   new Date().toISOString(),
    };

    await db.reports.insert(report);
    res.status(201).json({ message: 'Report submitted. Thank you.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not submit report' });
  }
});

module.exports = router;
