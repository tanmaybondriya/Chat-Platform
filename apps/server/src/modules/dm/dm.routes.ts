import { Router } from 'express';
import { authenticate } from 'src/shared/middleware/auth.middleware';
import { DMController } from './dm.controller';
const router = Router();
const controller = new DMController();

router.use(authenticate);

router.get('/', controller.getUserConversations);
router.post('/:userId', controller.getOrCreateConversation);
router.get('/:dmId/messages', controller.getMessages);

export default router;
