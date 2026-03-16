import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

const controller = new ChatController();

router.use(authenticate);
router.post('/rooms', controller.createRoom);
router.get('/rooms', controller.getAllRooms);
router.post('/rooms/:roomId/join', controller.joinRoom);
router.post('/rooms/:roomId/leave', controller.leaveRoom);
router.get('/rooms/:roomId/messages', controller.getMessages);

export default router;
