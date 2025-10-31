import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware';
import * as orbService from '../services/orb.service';

const router = Router();

// List memory orbs
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const orbs = await orbService.listOrbsForUser(userId);
    const serialized = await Promise.all(orbs.map(o => orbService.serializeOrb(o)));

    return res.json({
      items: serialized,
      count: serialized.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create memory orb
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { diaryId, emotion, date, reinterpretationNote } = req.body;
    const userId = req.user!.id;

    if (!diaryId || !emotion) {
      return res.status(400).json({ error: 'diaryId and emotion are required' });
    }

    const orbDate = date || new Date().toISOString();

    const orb = await orbService.createOrb(
      userId,
      diaryId,
      emotion,
      orbDate,
      reinterpretationNote
    );

    const serialized = await orbService.serializeOrb(orb);
    return res.status(201).json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get memory orb
router.get('/:orbId', authenticate, async (req: Request, res: Response) => {
  try {
    const orb = await orbService.getOrb(req.params.orbId);

    if (!orb || orb.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Memory orb not found' });
    }

    const serialized = await orbService.serializeOrb(orb);
    return res.json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Reinterpret memory orb
router.post('/:orbId/reinterpret', authenticate, async (req: Request, res: Response) => {
  try {
    const orb = await orbService.getOrb(req.params.orbId);

    if (!orb || orb.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Memory orb not found' });
    }

    const { reinterpretationNote, reinterpretationReplies } = req.body;

    const updated = await orbService.updateOrb(req.params.orbId, {
      isReinterpreted: true,
      reinterpretationNote,
      reinterpretationReplies,
    });

    const serialized = await orbService.serializeOrb(updated);
    return res.json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
