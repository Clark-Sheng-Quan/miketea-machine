import express from 'express';
import { FlavorModel } from '../models/Flavor.js';
import { QRGeneratorService } from '../services/qrGeneratorService.js';

const router = express.Router();

// POS: Get flavor list
router.get('/flavors', async (req, res, next) => {
  try {
    const flavors = await FlavorModel.getFlavorsForPOS();
    res.json({
      success: true,
      data: flavors,
      timestamp: new Date().toISOString(),
      version: '1.0'
    });
  } catch (error) {
    next(error);
  }
});

// POS: Generate QR protocol
router.post('/generate-qr', async (req, res, next) => {
  try {
    const { serial, billNo, barcode, flavors, sku, quantity, price } = req.body;

    // Validate
    const validation = QRGeneratorService.validateProtocolData({
      serial,
      billNo,
      barcode,
      flavors,
      sku
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        missing: validation.missing
      });
    }

    // Generate protocol
    const result = await QRGeneratorService.generateQRProtocol({
      serial,
      billNo,
      barcode,
      flavors,
      sku,
      quantity,
      price
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POS: Generate QR image
router.post('/generate-qr-image', async (req, res, next) => {
  try {
    const { protocol_string } = req.body;

    if (!protocol_string) {
      return res.status(400).json({ success: false, error: 'protocol_string is required' });
    }

    const qrImage = await QRGeneratorService.generateQRImage(protocol_string);

    res.json({
      success: true,
      qrImage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
