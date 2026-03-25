import { Router } from 'express';
import { UsersController } from './user.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new UsersController();

router.use(authenticate);
router.get('/search', controller.searchUsers);

export default router;
