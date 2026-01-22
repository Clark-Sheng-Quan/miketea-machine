import express from 'express';
import { FlavorModel } from '../models/Flavor.js';
import { FlavorSyncService } from '../services/flavorSyncService.js';

const router = express.Router();

// Get all flavors
router.get('/', async (req, res, next) => {
  try {
    const flavors = await FlavorModel.getAllFlavors();
    res.json({ success: true, data: flavors });
  } catch (error) {
    next(error);
  }
});

// Get flavor by ID
router.get('/:id', async (req, res, next) => {
  try {
    const flavor = await FlavorModel.getFlavorById(req.params.id);
    if (!flavor) {
      return res.status(404).json({ success: false, error: 'Flavor not found' });
    }
    res.json({ success: true, data: flavor });
  } catch (error) {
    next(error);
  }
});

// Get flavors by group
router.get('/group/:groupName', async (req, res, next) => {
  try {
    const flavors = await FlavorModel.getFlavorsByGroup(req.params.groupName);
    res.json({ success: true, data: flavors });
  } catch (error) {
    next(error);
  }
});

// Create flavor (Admin)
router.post('/', async (req, res, next) => {
  try {
    const { flavor_code, flavor_name, group_name, product_system_id } = req.body;

    if (!flavor_code || !flavor_name || !group_name) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const flavor = await FlavorModel.createFlavor({
      flavor_code,
      flavor_name,
      group_name,
      product_system_id
    });

    res.status(201).json({ success: true, data: flavor });
  } catch (error) {
    next(error);
  }
});

// Update flavor (Admin)
router.put('/:id', async (req, res, next) => {
  try {
    const { flavor_name, group_name } = req.body;

    const flavor = await FlavorModel.updateFlavor(req.params.id, {
      flavor_name,
      group_name
    });

    res.json({ success: true, data: flavor });
  } catch (error) {
    next(error);
  }
});

// Delete flavor (Admin)
router.delete('/:id', async (req, res, next) => {
  try {
    await FlavorModel.deleteFlavor(req.params.id);
    res.json({ success: true, message: 'Flavor deleted' });
  } catch (error) {
    next(error);
  }
});

// Sync flavors from Product System (Admin)
router.post('/sync/from-product-system', async (req, res, next) => {
  try {
    const result = await FlavorSyncService.syncFlavorsFromProductSystem();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
