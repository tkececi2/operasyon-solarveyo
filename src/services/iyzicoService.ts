// iyzico Mock Service - Gerçek entegrasyon için backend gerekli
import { SAAS_CONFIG, getPlanById } from '../config/saas.config';

const MOCK_MODE = true; // Geliştirme için mock mode

// Mock ödeme sonuçları
const MOCK_RESPONSES = {
  success: {
    status: 'success',
    locale: 'tr',
    systemTime: Date.now(),
    conversationId: '',
    token: 'mock-token-' + Math.random().toString(36),
    checkoutFormContent: '<html>Mock Payment Form</html>',
    tokenExpireTime: Date.now() + 30 * 60 * 1000, // 30 dakika
    paymentPageUrl: `${window.location.origin}/payment/mock-checkout`
  },
  error: {
    status: 'failure',
    errorMessage: 'Mock ödeme hatası'
  }
};

export interface IyzicoPaymentRequest {
  locale?: string;
  conversationId: string;
  price: string; // string olarak değiştirildi
  paidPrice: string; // string olarak değiştirildi
  currency: 'TRY';
  basketId: string;
  paymentGroup: 'SUBSCRIPTION';
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2: string;
    itemType: 'VIRTUAL';
    price: string; // string olarak değiştirildi
  }>;
}

export interface IyzicoPaymentResponse {
  status: string;
  locale: string;
  systemTime: number;
  conversationId: string;
  token: string;
  checkoutFormContent: string;
  tokenExpireTime: number;
  paymentPageUrl: string;
}

// Ödeme sayfası oluşturma
export const createPaymentForm = async (request: IyzicoPaymentRequest): Promise<IyzicoPaymentResponse> => {
  if (MOCK_MODE) {
    // Mock response döndür
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
    
    const mockResponse = {
      ...MOCK_RESPONSES.success,
      conversationId: Date.now().toString()
    };
    
    console.log('Mock ödeme formu oluşturuldu:', mockResponse);
    return mockResponse;
  }

  // Gerçek iyzico entegrasyonu backend'de yapılmalı
  throw new Error('iyzico entegrasyonu için backend servisi gerekli. Şimdilik mock mode kullanılıyor.');
};

// Ödeme sonucu kontrolü
export const retrievePaymentResult = async (token: string): Promise<any> => {
  if (MOCK_MODE) {
    // Mock başarılı ödeme sonucu
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // URL'den company ID'yi al
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('companyId') || 'mock-company-id';
    const planName = urlParams.get('planName') || 'Professional';
    const planPrice = urlParams.get('planPrice') || '99.00';

    const mockResult = {
      status: 'success',
      paymentStatus: 'SUCCESS',
      paidPrice: planPrice,
      paymentId: 'mock-payment-' + Math.random().toString(36),
      buyer: {
        id: companyId
      },
      basketItems: [{
        name: `SolarVeyo ${planName} Plan`
      }],
      errorMessage: null
    };
    
    console.log('Mock ödeme sonucu:', mockResult);
    return mockResult;
  }

  throw new Error('iyzico ödeme kontrolü için backend servisi gerekli. Şimdilik mock mode kullanılıyor.');
};

// Abonelik planları için ödeme isteği oluşturma
export const createSubscriptionPayment = async (
  companyId: string,
  planId: string, // planName -> planId olarak değiştirildi
  userInfo: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    identityNumber?: string;
  }
): Promise<IyzicoPaymentResponse> => {
  // SAAS_CONFIG'den plan bilgilerini al
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  const planPrice = plan.price;
  const planName = plan.name;
  
  const conversationId = `${companyId}_${Date.now()}`;
  const basketId = `basket_${conversationId}`;

  const request: IyzicoPaymentRequest = {
    locale: 'tr',
    conversationId,
    price: planPrice.toString(),
    paidPrice: planPrice.toString(),
    currency: 'TRY',
    basketId,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${window.location.origin}/payment/callback`,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: companyId,
      name: userInfo.name,
      surname: userInfo.surname,
      gsmNumber: userInfo.phone,
      email: userInfo.email,
      identityNumber: userInfo.identityNumber || '11111111111',
      registrationAddress: userInfo.address,
      ip: '85.34.78.112', // Gerçek IP alınmalı
      city: userInfo.city,
      country: 'Turkey',
      zipCode: '34732'
    },
    shippingAddress: {
      contactName: `${userInfo.name} ${userInfo.surname}`,
      city: userInfo.city,
      country: 'Turkey',
      address: userInfo.address,
      zipCode: '34732'
    },
    billingAddress: {
      contactName: `${userInfo.name} ${userInfo.surname}`,
      city: userInfo.city,
      country: 'Turkey',
      address: userInfo.address,
      zipCode: '34732'
    },
    basketItems: [
      {
        id: `plan_${planName}`,
        name: `SolarVeyo ${planName} Plan`,
        category1: 'Yazılım',
        category2: 'SaaS',
        itemType: 'VIRTUAL',
        price: planPrice.toString() // string olarak gönderilecek
      }
    ]
  };

  return createPaymentForm(request);
};

// Test ödeme bilgileri
export const TEST_CARDS = {
  SUCCESS: '5528790000000008', // Başarılı test kartı
  INSUFFICIENT_FUNDS: '5528790000000016', // Yetersiz bakiye
  DO_NOT_HONOR: '5528790000000024', // Kart red
  INVALID_TRANSACTION: '5528790000000032' // Geçersiz işlem
};

// Ödeme durumu kontrol etme
export const checkPaymentStatus = async (paymentId: string): Promise<any> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      status: 'success',
      paymentStatus: 'SUCCESS',
      paidPrice: '99.00',
      paymentId: paymentId
    };
  }

  throw new Error('iyzico ödeme durumu kontrolü için backend servisi gerekli. Şimdilik mock mode kullanılıyor.');
};

// Mock checkout sayfası oluşturma
export const createMockCheckoutPage = () => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock İyzico Ödeme</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .btn { background: #00a650; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #008a43; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Mock İyzico Ödeme Sayfası</h2>
        <p>Bu test ödeme sayfasıdır. Gerçek kart bilgileri girmeyiniz.</p>
        
        <div style="margin: 20px 0;">
          <strong>Test Kartı:</strong><br>
          Kart No: 5528 7900 0000 0008<br>
          CVV: 123<br>
          Son Kullanma: 12/30
        </div>
        
        <button class="btn" onclick="completePayment()">
          Ödemeyi Tamamla (Mock)
        </button>
        
        <script>
          function completePayment() {
            // Callback sayfasına yönlendir
            window.location.href = '${window.location.origin}/payment/callback?token=mock-success-token';
          }
        </script>
      </div>
    </body>
    </html>
  `;
};
