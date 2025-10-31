import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware';
import * as diaryService from '../services/diary.service';
import * as aiService from '../services/ai.service';
import * as vectorStore from '../services/vector-store.service';

const router = Router();

// List diaries
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const emotion = req.query.emotion as string | undefined;
    const isEvolvedStr = req.query.isEvolved as string | undefined;
    const isEvolved = isEvolvedStr ? isEvolvedStr.toLowerCase() === 'true' : undefined;

    const items = await diaryService.listDiaries(userId, limit + 1, offset, emotion, isEvolved);
    const hasMore = items.length > limit;
    const diaries = items.slice(0, limit);

    const serialized = await Promise.all(diaries.map(d => diaryService.serializeDiary(d)));

    return res.json({
      items: serialized,
      limit,
      offset,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create diary
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { text, content, emotion, aiCharacter } = req.body;
    const userId = req.user!.id;

    if (!emotion) {
      return res.status(400).json({ error: 'Emotion is required' });
    }

    const diaryText = text || content;
    if (!diaryText) {
      return res.status(400).json({ error: 'Diary text is required' });
    }

    const diary = await diaryService.createDiary(
      userId,
      diaryText,
      emotion,
      aiCharacter || 'HeartOrb Companion',
      ''
    );

    // Generate embedding for vector search
    await vectorStore.addDiaryEmbedding(diary.id, diaryText);

    // Generate AI responses with RAG
    const responses = await aiService.generateResponses(diary, userId);

    // Update diary with AI responses
    const emotionColor = aiService.emotionToColor(diary.emotion);
    await diaryService.updateDiary(diary.id, {
      aiPersonaResponses: responses as any,
      emotionColor,
    });

    const updated = await diaryService.getDiary(diary.id);
    const serialized = await diaryService.serializeDiary(updated!);

    return res.status(201).json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get diary
router.get('/:diaryId', authenticate, async (req: Request, res: Response) => {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    const serialized = await diaryService.serializeDiary(diary);
    return res.json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update diary
router.put('/:diaryId', authenticate, async (req: Request, res: Response) => {
  return updateDiary(req, res);
});

router.patch('/:diaryId', authenticate, async (req: Request, res: Response) => {
  return updateDiary(req, res);
});

async function updateDiary(req: Request, res: Response) {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    const updates: any = {};
    const allowedFields = [
      'text', 'content', 'emotion', 'aiCharacter', 'aiResponse', 'isEvolved',
      'reinterpretation', 'evolvedEmotion', 'linkedPastDiaryId',
    ];

    for (const [key, value] of Object.entries(req.body)) {
      if (key === 'content' && allowedFields.includes('text')) {
        updates.text = value;
      } else if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      const serialized = await diaryService.serializeDiary(diary);
      return res.json(serialized);
    }

    const updated = await diaryService.updateDiary(req.params.diaryId, updates);
    const serialized = await diaryService.serializeDiary(updated);
    return res.json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete diary
router.delete('/:diaryId', authenticate, async (req: Request, res: Response) => {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    await diaryService.deleteDiary(req.params.diaryId);
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh AI
router.post('/:diaryId/refresh-ai', authenticate, async (req: Request, res: Response) => {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    // Generate AI responses with RAG
    const responses = await aiService.generateResponses(diary, diary.userId);

    await diaryService.updateDiary(diary.id, {
      aiPersonaResponses: responses as any,
    });

    const updated = await diaryService.getDiary(diary.id);
    const serialized = await diaryService.serializeDiary(updated!);
    return res.json(serialized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reinterpret context - finds semantically similar past diary
router.get('/:diaryId/reinterpret/context', authenticate, async (req: Request, res: Response) => {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    // Search for semantically similar diaries (exclude current diary)
    const similarDiaries = await aiService.searchContextDiaries(diary, diary.userId, 1);

    if (similarDiaries.length === 0) {
      return res.json({
        contextDiary: null,
        message: 'No similar past diaries found',
      });
    }

    const contextDiary = similarDiaries[0];

    return res.json({
      contextDiary: {
        id: contextDiary.id,
        text: contextDiary.text,
        emotion: contextDiary.emotion,
        createdAt: contextDiary.date,
        similarity: contextDiary.similarity,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit reinterpret reply - saves user response and marks orb
router.post('/:diaryId/reinterpret/reply', authenticate, async (req: Request, res: Response) => {
  try {
    const diary = await diaryService.getDiary(req.params.diaryId);

    if (!diary || diary.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Diary not found' });
    }

    const { characterId, reply } = req.body;

    if (!characterId || !reply) {
      return res.status(400).json({ error: 'characterId and reply are required' });
    }

    // Get similar diary for context (to store reference)
    const similarDiaries = await aiService.searchContextDiaries(diary, diary.userId, 1);
    const linkedPastDiaryId = similarDiaries.length > 0 ? similarDiaries[0].id : null;

    // Update diary with reinterpretation
    await diaryService.updateDiary(diary.id, {
      reinterpretation: reply,
      linkedPastDiaryId,
      isEvolved: true,
    });

    // Find and update the associated memory orb
    const orbs = await aiService.findOrbByDiaryId(diary.id);
    if (orbs && orbs.length > 0) {
      const orb = orbs[0];
      const existingReplies = orb.reinterpretationReplies || [];
      const newReply = {
        id: `reply-${Date.now()}`,
        characterId,
        characterName: getCharacterName(characterId),
        message: reply,
        timestamp: new Date().toISOString(),
      };

      await aiService.updateOrb(orb.id, {
        isReinterpreted: true,
        reinterpretationReplies: [...existingReplies, newReply],
      });
    }

    const updated = await diaryService.getDiary(diary.id);
    const serialized = await diaryService.serializeDiary(updated!);

    return res.json({
      success: true,
      diary: serialized,
      linkedPastDiaryId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function getCharacterName(characterId: string): string {
  const characters: Record<string, string> = {
    'char1': '루미',
    'char2': '모카',
    'char3': '제트',
  };
  return characters[characterId] || 'Unknown Character';
}

export default router;
