import { db } from '../config/database.js';

export class QRProtocolModel {
  static async createQRProtocol(data) {
    const { serial, bill_no, barcode, flavors, sku, quantity, price, protocol_string, template_id } = data;
    return db.one(
      `INSERT INTO qr_protocols (serial, bill_no, barcode, flavors, sku, quantity, price, protocol_string, template_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [serial, bill_no, barcode, flavors, sku, quantity, price, protocol_string, template_id]
    );
  }

  static async getQRProtocolBySerial(serial) {
    return db.oneOrNone(
      'SELECT * FROM qr_protocols WHERE serial = $1 ORDER BY created_at DESC LIMIT 1',
      [serial]
    );
  }

  static async getQRProtocolsByBillNo(billNo) {
    return db.query(
      'SELECT * FROM qr_protocols WHERE bill_no = $1 ORDER BY created_at DESC',
      [billNo]
    );
  }

  static async getAllQRProtocols(limit = 100, offset = 0) {
    return db.query(
      'SELECT * FROM qr_protocols ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
  }

  static async searchQRProtocols(filters) {
    let query = 'SELECT * FROM qr_protocols WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.serial) {
      query += ` AND serial ILIKE $${paramCount}`;
      params.push(`%${filters.serial}%`);
      paramCount++;
    }

    if (filters.billNo) {
      query += ` AND bill_no ILIKE $${paramCount}`;
      params.push(`%${filters.billNo}%`);
      paramCount++;
    }

    if (filters.barcode) {
      query += ` AND barcode ILIKE $${paramCount}`;
      params.push(`%${filters.barcode}%`);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    return db.query(query, params);
  }
}

export default QRProtocolModel;
