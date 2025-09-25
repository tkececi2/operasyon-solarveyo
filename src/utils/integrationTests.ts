/**
 * 🧪 Integration Tests
 * SolarVeyo - System Integration Validation
 */

import { getPlanById, getActivePlans } from '../config/saas.config';
import { createSubscriptionPayment } from '../services/iyzicoService';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

// ===== 1. PAYMENT SYSTEM INTEGRATION TESTS =====

export const testPaymentIntegration = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  console.log('\n🧪 1. PAYMENT SYSTEM INTEGRATION TESTS');
  
  // Test 1.1: SAAS_CONFIG Plan Validation
  try {
    const starterPlan = getPlanById('starter');
    const professionalPlan = getPlanById('professional');
    const enterprisePlan = getPlanById('enterprise');
    
    const allPlansValid = !!(starterPlan && professionalPlan && enterprisePlan);
    testResults.push({
      testName: 'SAAS_CONFIG Plan Access',
      passed: allPlansValid,
      message: allPlansValid ? 'All plans accessible from SAAS_CONFIG' : 'Some plans missing from SAAS_CONFIG',
      details: { 
        starter: starterPlan?.price,
        professional: professionalPlan?.price,
        enterprise: enterprisePlan?.price
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'SAAS_CONFIG Plan Access',
      passed: false,
      message: `Error accessing plans: ${errorMessage}`
    });
  }

  // Test 1.2: iyzico Integration with SAAS_CONFIG
  try {
    const testUserInfo = {
      name: 'Test',
      surname: 'User', 
      email: 'test@solarveyo.com',
      phone: '05551234567',
      address: 'Test Address',
      city: 'İstanbul'
    };

    const paymentResponse = await createSubscriptionPayment(
      'test-company-id',
      'professional',
      testUserInfo
    );

    const iyzicoIntegrationWorking = paymentResponse && paymentResponse.status === 'success';
    testResults.push({
      testName: 'iyzico SAAS_CONFIG Integration',
      passed: iyzicoIntegrationWorking,
      message: iyzicoIntegrationWorking ? 'iyzico successfully uses SAAS_CONFIG pricing' : 'iyzico integration failed',
      details: { 
        status: paymentResponse?.status,
        planUsed: 'professional',
        paymentUrl: paymentResponse?.paymentPageUrl
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'iyzico SAAS_CONFIG Integration',
      passed: false,
      message: `iyzico integration error: ${errorMessage}`
    });
  }

  return testResults.filter(r => r.testName.includes('Payment') || r.testName.includes('SAAS_CONFIG') || r.testName.includes('iyzico'));
};

// ===== 2. ANALYTICS REAL DATA TESTS =====

export const testAnalyticsRealData = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  console.log('\n📊 2. ANALYTICS REAL DATA TESTS');
  
  try {
    const analyticsModule = await import('../services/analyticsService');
    
    // Detaylı modül içeriğini logla (debug için)
    console.log('Analytics module keys:', Object.keys(analyticsModule));
    
    // Analytics servisini doğru şekilde al
    let analyticsServiceInstance: any = null;
    
    // Önce doğrudan named export'u dene
    if (analyticsModule.analyticsService) {
      analyticsServiceInstance = analyticsModule.analyticsService;
    } 
    // Sonra default export'u dene
    else if (analyticsModule.default) {
      analyticsServiceInstance = analyticsModule.default;
    }
    // Ardından diğer olası export'ları dene
    else {
      const possibleExports = Object.values(analyticsModule);
      for (const exp of possibleExports) {
        if (exp && (exp instanceof analyticsModule.ModernAnalyticsService || 
            (typeof exp === 'object' && typeof (exp as any).getRevenueAnalytics === 'function'))) {
          analyticsServiceInstance = exp;
          break;
        }
      }
    }
    
    if (analyticsServiceInstance) {
      testResults.push({
        testName: 'Analytics Service Loading',
        passed: true,
        message: 'Analytics service loaded successfully',
        details: { serviceType: typeof analyticsServiceInstance }
      });
      
      // Servis metodlarını test et
      try {
        const hasGetRevenueAnalytics = typeof analyticsServiceInstance.getRevenueAnalytics === 'function';
        const hasGetUserAnalytics = typeof analyticsServiceInstance.getUserAnalytics === 'function';
        const hasGetPlatformAnalytics = typeof analyticsServiceInstance.getPlatformAnalytics === 'function';
        
        const allMethodsAvailable = hasGetRevenueAnalytics && hasGetUserAnalytics && hasGetPlatformAnalytics;
        
        testResults.push({
          testName: 'Analytics Service Methods',
          passed: allMethodsAvailable,
          message: allMethodsAvailable ? 'All analytics service methods available' : 'Some analytics service methods missing',
          details: { 
            hasGetRevenueAnalytics,
            hasGetUserAnalytics, 
            hasGetPlatformAnalytics
          }
        });
      } catch (serviceError) {
        const errorMessage = serviceError instanceof Error ? serviceError.message : String(serviceError);
        testResults.push({
          testName: 'Analytics Service Methods',
          passed: false,
          message: `Error testing analytics service methods: ${errorMessage}`
        });
      }
    } else {
      testResults.push({
        testName: 'Analytics Service Loading',
        passed: false,
        message: 'Analytics service not found in module exports',
        details: { 
          availableKeys: Object.keys(analyticsModule),
          moduleType: typeof analyticsModule
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'Analytics Service Loading',
      passed: false,
      message: `Error loading analytics: ${errorMessage}`
    });
  }

  return testResults.filter(r => r.testName.includes('Analytics'));
};

// ===== 3. STORAGE CALCULATIONS TESTS =====

export const testStorageCalculations = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  console.log('\n💾 3. STORAGE CALCULATIONS TESTS');
  
  try {
    const storageUtils = await import('../utils/storageUtils');
    
    const hasAllUtilFunctions = 
      typeof storageUtils.formatMBtoGB === 'function' &&
      typeof storageUtils.calculateStoragePercentage === 'function' &&
      typeof storageUtils.STORAGE_DECIMAL_PLACES === 'number';

    testResults.push({
      testName: 'Storage Utils Functions',
      passed: hasAllUtilFunctions,
      message: hasAllUtilFunctions ? 'All storage utility functions available' : 'Some storage utilities missing'
    });

    // Test decimal formatting
    const testMB = 1536; // 1.5 GB
    const formattedGB = storageUtils.formatMBtoGB(testMB);
    const hasCorrectDecimals = formattedGB === '1.50';

    testResults.push({
      testName: 'Storage Decimal Formatting',
      passed: hasCorrectDecimals,
      message: hasCorrectDecimals ? 'Storage formatting uses exactly 2 decimals' : 'Storage formatting inconsistent',
      details: { input: testMB, output: formattedGB, expected: '1.50' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'Storage Utils Functions',
      passed: false,
      message: `Error loading storage utils: ${errorMessage}`
    });
  }

  return testResults.filter(r => r.testName.includes('Storage'));
};

// ===== 4. SECURITY & ROLES TESTS =====

export const testSecurityRoles = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  console.log('\n🔐 4. SECURITY & ROLES TESTS');
  
  try {
    const roleTools = await import('../utils/roleTools');
    testResults.push({
      testName: 'Role Tools Loading',
      passed: true,
      message: 'Role tools loaded successfully'
    });

    // Test dangerous functions are disabled
    let dangerousFunctionDisabled = false;
    try {
      await (roleTools as any).promoteToSuperadmin?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      dangerousFunctionDisabled = errorMessage.includes('güvenlik nedeniyle devre dışı') ||
                                 errorMessage.includes('SECURITY VIOLATION');
    }

    testResults.push({
      testName: 'Security Functions Disabled',
      passed: dangerousFunctionDisabled,
      message: dangerousFunctionDisabled ? 'Dangerous superadmin functions properly disabled' : 'Security functions still accessible'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'Role Tools Loading',
      passed: false,
      message: `Error loading role tools: ${errorMessage}`
    });
  }

  return testResults.filter(r => r.testName.includes('Security') || r.testName.includes('Role'));
};

// ===== 5. UI CONSISTENCY TESTS =====

export const testUIConsistency = async (): Promise<TestResult[]> => {
  const testResults: TestResult[] = [];
  console.log('\n🎨 5. UI CONSISTENCY TESTS');
  
  try {
    const activePlans = getActivePlans();
    const allPlansHaveRequiredFields = activePlans.every(plan => 
      plan.id && 
      plan.displayName && 
      typeof plan.price === 'number' &&
      plan.limits &&
      plan.features
    );

    testResults.push({
      testName: 'Plan Display Consistency',
      passed: allPlansHaveRequiredFields,
      message: allPlansHaveRequiredFields ? 'All plans have consistent display fields' : 'Some plans missing required fields',
      details: { planCount: activePlans.length }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({
      testName: 'Plan Display Consistency',
      passed: false,
      message: `Error testing UI consistency: ${errorMessage}`
    });
  }

  return testResults.filter(r => r.testName.includes('UI') || r.testName.includes('Display'));
};

// ===== MAIN TEST RUNNER =====

export const runAllIntegrationTests = async (): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  results: TestResult[];
}> => {
  console.log('🚀 SOLARVEYO INTEGRATION TESTS STARTING...');

  // Run all test suites
  const paymentResults = await testPaymentIntegration();
  const analyticsResults = await testAnalyticsRealData();
  const storageResults = await testStorageCalculations();
  const securityResults = await testSecurityRoles();
  const uiResults = await testUIConsistency();

  const allResults = [...paymentResults, ...analyticsResults, ...storageResults, ...securityResults, ...uiResults];
  
  // Calculate summary
  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  console.log('\n📊 TEST SUMMARY');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    results: allResults
  };
};