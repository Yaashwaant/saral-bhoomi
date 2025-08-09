import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

class ReceiptService {
  constructor() {
    this.receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
    this.ensureReceiptsDirectory();
  }

  /**
   * Ensure receipts directory exists
   */
  ensureReceiptsDirectory() {
    if (!fs.existsSync(this.receiptsDir)) {
      fs.mkdirSync(this.receiptsDir, { recursive: true });
    }
  }

  /**
   * Generate PDF receipt
   */
  async generateReceipt(paymentData) {
    return new Promise((resolve, reject) => {
      try {
        const {
          transactionId,
          utrNumber,
          amount,
          accountHolderName,
          bankAccountNumber,
          ifscCode,
          paymentDate,
          projectName,
          landownerName,
          surveyNumber
        } = paymentData;

        const fileName = `receipt-${transactionId}-${Date.now()}.pdf`;
        const filePath = path.join(this.receiptsDir, fileName);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add government letterhead
        this.addLetterhead(doc);

        // Add receipt content
        this.addReceiptContent(doc, {
          transactionId,
          utrNumber,
          amount,
          accountHolderName,
          bankAccountNumber,
          ifscCode,
          paymentDate,
          projectName,
          landownerName,
          surveyNumber
        });

        // Add footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({
            success: true,
            filePath: filePath,
            fileName: fileName,
            fileSize: fs.statSync(filePath).size
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add government letterhead to PDF
   */
  addLetterhead(doc) {
    // Government of India emblem (placeholder)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('भारत सरकार', { align: 'center' })
       .fontSize(18)
       .text('Government of India', { align: 'center' })
       .fontSize(16)
       .text('Ministry of Rural Development', { align: 'center' })
       .fontSize(14)
       .text('Department of Land Resources', { align: 'center' })
       .moveDown(2);

    // Line separator
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(1);
  }

  /**
   * Add receipt content to PDF
   */
  addReceiptContent(doc, data) {
    const {
      transactionId,
      utrNumber,
      amount,
      accountHolderName,
      bankAccountNumber,
      ifscCode,
      paymentDate,
      projectName,
      landownerName,
      surveyNumber
    } = data;

    // Receipt title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', { align: 'center' })
       .moveDown(1);

    // Receipt details
    doc.fontSize(12)
       .font('Helvetica');

    const details = [
      { label: 'Receipt Number', value: transactionId },
      { label: 'UTR Number', value: utrNumber || 'Pending' },
      { label: 'Payment Date', value: new Date(paymentDate).toLocaleDateString('en-IN') },
      { label: 'Project Name', value: projectName },
      { label: 'Landowner Name', value: landownerName },
      { label: 'Survey Number', value: surveyNumber },
      { label: 'Payment Amount', value: `₹${parseFloat(amount).toLocaleString('en-IN')}` },
      { label: 'Account Holder', value: accountHolderName },
      { label: 'Bank Account', value: bankAccountNumber },
      { label: 'IFSC Code', value: ifscCode }
    ];

    details.forEach(({ label, value }) => {
      doc.text(`${label}:`, 50, doc.y)
         .font('Helvetica-Bold')
         .text(value, 200, doc.y - 15)
         .font('Helvetica')
         .moveDown(0.5);
    });

    doc.moveDown(2);

    // Payment confirmation
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Payment Confirmation', { align: 'center' })
       .moveDown(1);

    doc.fontSize(12)
       .font('Helvetica')
       .text('This is to confirm that the payment of ₹' + parseFloat(amount).toLocaleString('en-IN') + 
             ' has been processed successfully for land acquisition compensation.', { align: 'justify' })
       .moveDown(1);

    doc.text('The payment has been credited to the beneficiary account as per the details mentioned above.', { align: 'justify' })
       .moveDown(2);

    // Signature section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Authorized Signature', 50, doc.y)
       .font('Helvetica')
       .text('_________________', 50, doc.y + 20)
       .text('(Authorized Officer)', 50, doc.y + 40)
       .moveDown(2);

    // Stamp area
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('OFFICIAL SEAL', 400, doc.y)
       .font('Helvetica')
       .text('(Government of India)', 400, doc.y + 15);
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc) {
    doc.moveDown(3);

    // Footer line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(1);

    // Footer text
    doc.fontSize(10)
       .font('Helvetica')
       .text('This is a computer generated receipt. No signature required.', { align: 'center' })
       .text('Generated on: ' + new Date().toLocaleString('en-IN'), { align: 'center' });
  }

  /**
   * Send receipt via email
   */
  async sendReceiptEmail(emailData) {
    try {
      const {
        toEmail,
        toName,
        filePath,
        fileName,
        paymentData
      } = emailData;

      // Create email transporter
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const {
        transactionId,
        amount,
        paymentDate,
        projectName
      } = paymentData;

      // Email content
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@saralbhoomi.gov.in',
        to: toEmail,
        subject: `Payment Receipt - Transaction ${transactionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Payment Receipt</h2>
            <p>Dear ${toName},</p>
            <p>Your payment has been processed successfully. Please find the receipt attached.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">Payment Details</h3>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Amount:</strong> ₹${parseFloat(amount).toLocaleString('en-IN')}</p>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Payment Date:</strong> ${new Date(paymentDate).toLocaleDateString('en-IN')}</p>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>Saral Bhoomi Team</p>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            path: filePath
          }
        ]
      };

      const result = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send receipt via SMS (placeholder for SMS service)
   */
  async sendReceiptSMS(smsData) {
    try {
      const {
        phoneNumber,
        transactionId,
        amount,
        utrNumber
      } = smsData;

      // Placeholder for SMS service integration
      // In production, integrate with actual SMS service like Twilio, AWS SNS, etc.
      
      const message = `Your payment of ₹${parseFloat(amount).toLocaleString('en-IN')} has been processed. 
                      Transaction ID: ${transactionId}. 
                      UTR: ${utrNumber || 'Pending'}. 
                      Receipt sent to your email.`;

      console.log(`SMS would be sent to ${phoneNumber}: ${message}`);

      return {
        success: true,
        message: 'SMS notification logged (SMS service not configured)'
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate and send receipt
   */
  async generateAndSendReceipt(paymentData, deliveryOptions = {}) {
    try {
      // Generate PDF receipt
      const receiptResult = await this.generateReceipt(paymentData);
      
      if (!receiptResult.success) {
        throw new Error('Failed to generate receipt');
      }

      const results = {
        receiptGenerated: receiptResult,
        emailSent: null,
        smsSent: null
      };

      // Send email if requested
      if (deliveryOptions.sendEmail && deliveryOptions.emailData) {
        const emailResult = await this.sendReceiptEmail({
          ...deliveryOptions.emailData,
          filePath: receiptResult.filePath,
          fileName: receiptResult.fileName,
          paymentData
        });
        results.emailSent = emailResult;
      }

      // Send SMS if requested
      if (deliveryOptions.sendSMS && deliveryOptions.smsData) {
        const smsResult = await this.sendReceiptSMS(deliveryOptions.smsData);
        results.smsSent = smsResult;
      }

      return {
        success: true,
        data: results
      };

    } catch (error) {
      console.error('Receipt generation and sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get receipt file
   */
  async getReceiptFile(fileName) {
    try {
      const filePath = path.join(this.receiptsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Receipt file not found');
      }

      const fileStats = fs.statSync(filePath);
      
      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        fileSize: fileStats.size,
        contentType: 'application/pdf'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete receipt file
   */
  async deleteReceiptFile(fileName) {
    try {
      const filePath = path.join(this.receiptsDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: true,
        message: 'Receipt file deleted successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const receiptService = new ReceiptService();

export default receiptService;

