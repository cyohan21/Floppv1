import { Router } from 'express'
import { healthCheck } from '../controllers/healthCheck'
const router = Router()

router.get('/health', healthCheck)

export default router