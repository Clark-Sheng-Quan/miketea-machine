import express from 'express';
import { QRGeneratorService } from '../services/qrGeneratorService.js';
import { QRProtocolModel } from '../models/QRProtocol.js';

const router = express.Router();

// Generate QR protocol
router.post('/generate', async (req, res, next) => {
  try {
    const { serial, billNo, barcode, flavors, sku, quantity, price } = req.body;

    // Validate required fields
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
        error: 'Missing required fields',
        missing: validation.missing
      });
    }

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

// Generate QR image
router.post('/generate-image', async (req, res, next) => {
  try {
    const { protocol_string, errorCorrectionLevel, width } = req.body;

    if (!protocol_string) {
      return res.status(400).json({ success: false, error: 'protocol_string is required' });
    }

    const qrImage = await QRGeneratorService.generateQRImage(protocol_string, {
      errorCorrectionLevel,
      width
    });

    res.json({ success: true, qrImage });
  } catch (error) {
    next(error);
  }
});

// Get QR protocol by serial
router.get('/by-serial/:serial', async (req, res, next) => {
  try {
    const protocol = await QRProtocolModel.getQRProtocolBySerial(req.params.serial);
    if (!protocol) {
      return res.status(404).json({ success: false, error: 'Protocol not found' });
    }
    res.json({ success: true, data: protocol });
  } catch (error) {
    next(error);
  }
});

// Get QR protocols by bill number
router.get('/by-billno/:billNo', async (req, res, next) => {
  try {
    const protocols = await QRProtocolModel.getQRProtocolsByBillNo(req.params.billNo);
    res.json({ success: true, data: protocols });
  } catch (error) {
    next(error);
  }
});

// Search QR protocols
router.get('/search', async (req, res, next) => {
  try {
    const { serial, billNo, barcode } = req.query;
    const protocols = await QRProtocolModel.searchQRProtocols({
      serial,
      billNo,
      barcode
    });
    res.json({ success: true, data: protocols });
  } catch (error) {
    next(error);
  }
});

export default router;
