import QRCode from 'qrcode';
import { TemplateModel } from '../models/Template.js';
import { QRProtocolModel } from '../models/QRProtocol.js';

export class QRGeneratorService {
  static async generateQRProtocol(orderData) {
    try {
      const { serial, billNo, barcode, flavors, sku, quantity, price } = orderData;

      // Get active template
      const template = await TemplateModel.getActiveTemplate();
      if (!template) {
        throw new Error('No active QR template found');
      }

      // Generate protocol string
      const protocolString = this.replaceTemplateePlaceholders(
        template.template_pattern,
        {
          serial,
          billNo,
          barcode,
          flavors: Array.isArray(flavors) ? flavors.join(',') : flavors,
          sku,
          quantity,
          price
        }
      );

      // Save protocol record
      const protocol = await QRProtocolModel.createQRProtocol({
        serial,
        bill_no: billNo,
        barcode,
        flavors: Array.isArray(flavors) ? flavors.join(',') : flavors,
        sku,
        quantity,
        price,
        protocol_string: protocolString,
        template_id: template.id
      });

      return {
        success: true,
        protocol: protocolString,
        qrData: protocol,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[QRGenerator] Error generating protocol:', error.message);
      throw error;
    }
  }

  static replaceTemplateePlaceholders(template, values) {
    let result = template;

    const placeholders = {
      '{serial}': values.serial || '',
      '{billNo}': values.billNo || '',
      '{barcode}': values.barcode || '',
      '{flavors}': values.flavors || '',
      '{sku}': values.sku || '',
      '{quantity}': values.quantity || '',
      '{price}': values.price || ''
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  static async generateQRImage(protocolString, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'H',
        type: options.type || 'image/png',
        width: options.width || 300,
        margin: options.margin || 1,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        }
      };

      const qrImage = await QRCode.toDataURL(protocolString, qrOptions);
      return qrImage;
    } catch (error) {
      console.error('[QRGenerator] Error generating QR image:', error.message);
      throw error;
    }
  }

  static validateProtocolData(data) {
    const required = ['serial', 'billNo', 'barcode', 'flavors', 'sku'];
    const missing = required.filter(field => !data[field]);

    return {
      valid: missing.length === 0,
      missing,
      data
    };
  }
}

export default QRGeneratorService;
