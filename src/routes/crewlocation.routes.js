import express from 'express';
import { createLocation, getLocationsByRequest } from './crewLocation.controller';

const router = express.Router();

router.post('/locations', createLocation);
router.get('/locations/:requestId', getLocationsByRequest);

export default router;
