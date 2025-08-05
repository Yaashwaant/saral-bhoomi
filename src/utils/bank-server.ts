// Dummy Bank Server for RTGS Payment Processing
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.BANK_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

export interface PaymentRequest {
  beneficiaryName: string;
  beneficiaryAccount: string;
  beneficiaryIFSC: string;
  amount: number;
  purpose: string;
  referenceNumber: string;
  landownerId: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed' | 'processing';
  utrNumber?: string;
}

export interface BankAccount {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

// Simulate bank account database
const bankAccounts: BankAccount[] = [
  {
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    branchName: 'Palghar Main Branch'
  },
  {
    accountNumber: '0987654321',
    ifscCode: 'HDFC0005678',
    bankName: 'HDFC Bank',
    branchName: 'Vasai Branch'
  },
  {
    accountNumber: '1122334455',
    ifscCode: 'ICIC0009012',
    bankName: 'ICICI Bank',
    branchName: 'Dahanu Branch'
  }
];

// Simulate payment processing delays
const simulateProcessingDelay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate UTR Number
const generateUTRNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `UTR${timestamp}${random}`;
};

// Generate Transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `TXN${timestamp}${random}`;
};

// Validate bank account
const validateBankAccount = (accountNumber: string, ifscCode: string): boolean => {
  return bankAccounts.some(account => 
    account.accountNumber === accountNumber && 
    account.ifscCode === ifscCode
  );
};

// Simulate RTGS payment processing
export const processRTGSPayment = async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
  console.log('🔄 Processing RTGS payment:', paymentRequest);
  
  try {
    // Simulate network delay
    await simulateProcessingDelay(2000);

    // Validate beneficiary account
    if (!validateBankAccount(paymentRequest.beneficiaryAccount, paymentRequest.beneficiaryIFSC)) {
      console.log('❌ Invalid beneficiary account details');
      return {
        success: false,
        message: 'Invalid beneficiary account details',
        timestamp: new Date(),
        status: 'failed'
      };
    }

    // Simulate random failures (5% failure rate)
    const randomFailure = Math.random() < 0.05;
    if (randomFailure) {
      console.log('❌ Random failure occurred');
      return {
        success: false,
        message: 'Bank server temporarily unavailable',
        timestamp: new Date(),
        status: 'failed'
      };
    }

    // Generate success response
    const utrNumber = generateUTRNumber();
    const transactionId = generateTransactionId();

    console.log('✅ Payment processed successfully:', { transactionId, utrNumber });

    return {
      success: true,
      transactionId,
      message: 'Payment processed successfully',
      timestamp: new Date(),
      status: 'success',
      utrNumber
    };

  } catch (error) {
    console.log('❌ Payment processing error:', error);
    return {
      success: false,
      message: 'Payment processing failed due to technical error',
      timestamp: new Date(),
      status: 'failed'
    };
  }
};

// Get payment status
export const getPaymentStatus = async (transactionId: string): Promise<PaymentResponse> => {
  console.log('🔍 Checking payment status for:', transactionId);
  await simulateProcessingDelay(1000);
  
  return {
    success: true,
    transactionId,
    message: 'Payment completed successfully',
    timestamp: new Date(),
    status: 'success',
    utrNumber: `UTR${Date.now()}${Math.floor(Math.random() * 10000)}`
  };
};

// Validate IFSC Code
export const validateIFSCCode = (ifscCode: string): boolean => {
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscPattern.test(ifscCode);
};

// Get bank details by IFSC
export const getBankDetails = (ifscCode: string): BankAccount | null => {
  return bankAccounts.find(account => account.ifscCode === ifscCode) || null;
};

// Get all bank accounts (for testing)
export const getAllBankAccounts = (): BankAccount[] => {
  return bankAccounts;
};

// API Routes
app.get('/', (req, res) => {
  console.log('🏦 Bank server is running!');
  res.json({ 
    message: 'Dummy Bank Server is running!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      '/health': 'Server health check',
      '/accounts': 'Get all bank accounts',
      '/validate-ifsc/:ifsc': 'Validate IFSC code',
      '/process-payment': 'Process RTGS payment (POST)',
      '/payment-status/:transactionId': 'Get payment status'
    }
  });
});

app.get('/health', (req, res) => {
  console.log('💚 Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/accounts', (req, res) => {
  console.log('📋 Bank accounts requested');
  res.json(bankAccounts);
});

app.get('/validate-ifsc/:ifsc', (req, res) => {
  const { ifsc } = req.params;
  console.log('🔍 IFSC validation requested for:', ifsc);
  const isValid = validateIFSCCode(ifsc);
  const bankDetails = getBankDetails(ifsc);
  
  res.json({
    ifsc,
    isValid,
    bankDetails
  });
});

app.post('/process-payment', async (req, res) => {
  console.log('💰 Payment processing requested');
  const paymentRequest: PaymentRequest = req.body;
  
  const result = await processRTGSPayment(paymentRequest);
  res.json(result);
});

app.get('/payment-status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  console.log('📊 Payment status requested for:', transactionId);
  
  const result = await getPaymentStatus(transactionId);
  res.json(result);
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log('🏦 Dummy Bank Server started!');
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('📋 Available endpoints:');
    console.log('   GET  / - Server info');
    console.log('   GET  /health - Health check');
    console.log('   GET  /accounts - Bank accounts');
    console.log('   GET  /validate-ifsc/:ifsc - Validate IFSC');
    console.log('   POST /process-payment - Process payment');
    console.log('   GET  /payment-status/:id - Payment status');
  });
}

export default app; 