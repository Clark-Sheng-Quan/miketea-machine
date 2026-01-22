import express from 'express';
import { TemplateModel } from '../models/Template.js';

const router = express.Router();

// Get all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await TemplateModel.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get('/:id', async (req, res, next) => {
  try {
    const template = await TemplateModel.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Get active template
router.get('/active/current', async (req, res, next) => {
  try {
    const template = await TemplateModel.getActiveTemplate();
    if (!template) {
      return res.status(404).json({ success: false, error: 'No active template found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Create template (Admin)
router.post('/', async (req, res, next) => {
  try {
    const { name, template_pattern, description, is_active } = req.body;

    if (!name || !template_pattern) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Validate template
    const validation = TemplateModel.validateTemplate(template_pattern);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: 'Invalid template pattern', validation });
    }

    const template = await TemplateModel.createTemplate({
      name,
      template_pattern,
      description,
      is_active
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Update template (Admin)
router.put('/:id', async (req, res, next) => {
  try {
    const { name, template_pattern, description, is_active } = req.body;

    if (template_pattern) {
      const validation = TemplateModel.validateTemplate(template_pattern);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: 'Invalid template pattern', validation });
      }
    }

    const template = await TemplateModel.updateTemplate(req.params.id, {
      name,
      template_pattern,
      description,
      is_active
    });

    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Delete template (Admin)
router.delete('/:id', async (req, res, next) => {
  try {
    await TemplateModel.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
});

// Activate template (Admin)
router.post('/:id/activate', async (req, res, next) => {
  try {
    const template = await TemplateModel.activateTemplate(req.params.id);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

export default router;
