import { Hono } from 'hono';
import { ScanController } from '../controllers/scans.controller';

const router = new Hono()
    .get('/', ScanController.list)
    .get('/:id', ScanController.getById);

export default router;
