/**
 * 🧪 Integration Tests Debug Page
 * SolarVeyo - System Integration Validation Dashboard
 */

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, Button, Badge } from '../../components/ui';
import { 
  runAllIntegrationTests,
  testPaymentIntegration,
  testAnalyticsRealData,
  testStorageCalculations,
  testSecurityRoles,
  testUIConsistency
} from '../../utils/integrationTests';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  results: TestResult[];
}

const IntegrationTestsPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSummary | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [individualResults, setIndividualResults] = useState<Record<string, TestResult[]>>({});

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    try {
      const results = await runAllIntegrationTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runIndividualTest = async (testName: string, testFunction: () => Promise<TestResult[]>) => {
    setIsRunning(true);
    try {
      const results = await testFunction();
      setIndividualResults(prev => ({
        ...prev,
        [testName]: results
      }));
    } catch (error) {
      console.error(`Error running ${testName}:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const testCategories = [
    {
      id: 'payment',
      name: '💳 Payment Integration',
      description: 'SAAS_CONFIG ile Stripe/iyzico entegrasyonu',
      testFunction: testPaymentIntegration
    },
    {
      id: 'analytics',
      name: '📊 Analytics Real Data',
      description: 'Firebase gerçek veri çekme işlemleri',
      testFunction: testAnalyticsRealData
    },
    {
      id: 'storage',
      name: '💾 Storage Calculations',
      description: 'Merkezi depolama hesaplamaları',
      testFunction: testStorageCalculations
    },
    {
      id: 'security',
      name: '🔐 Security & Roles',
      description: 'Güvenlik güncellemeleri ve rol sistemi',
      testFunction: testSecurityRoles
    },
    {
      id: 'ui',
      name: '🎨 UI Consistency',
      description: 'Arayüz bileşenlerinin tutarlılığı',
      testFunction: testUIConsistency
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Integration Tests Dashboard
        </h1>
        <p className="text-gray-600">
          Sistem entegrasyonlarının doğruluğunu test edin ve sonuçları analiz edin
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="h-20 text-lg"
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
              Testler Çalışıyor...
            </>
          ) : (
            <>
              <Play className="h-6 w-6 mr-3" />
              Tüm Testleri Çalıştır
            </>
          )}
        </Button>

        <div className="flex items-center justify-center bg-blue-50 rounded-lg p-4">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-blue-900">
              Success Rate
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {testResults ? `${testResults.successRate.toFixed(1)}%` : '--'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-green-50 rounded-lg p-4">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-900">
              Tests Passed
            </div>
            <div className="text-2xl font-bold text-green-600">
              {testResults ? `${testResults.passedTests}/${testResults.totalTests}` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Test Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {testCategories.map((category) => {
          const results = individualResults[category.id] || [];
          const passedCount = results.filter(r => r.passed).length;
          const totalCount = results.length;
          
          return (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  {totalCount > 0 && (
                    <Badge variant={passedCount === totalCount ? 'success' : 'warning'}>
                      {passedCount}/{totalCount}
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={() => runIndividualTest(category.id, category.testFunction)}
                  disabled={isRunning}
                  variant="secondary"
                  className="w-full"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Testi Çalıştır
                </Button>

                {/* Individual Results */}
                {results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getStatusColor(result.passed)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(result.passed)}
                            <span className="font-medium text-sm">
                              {result.testName}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              Detayları Göster
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Results */}
      {testResults && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold">Genel Test Sonuçları</h2>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {testResults.totalTests}
                </div>
                <div className="text-sm text-gray-600">Toplam Test</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.passedTests}
                </div>
                <div className="text-sm text-green-700">Başarılı</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.failedTests}
                </div>
                <div className="text-sm text-red-700">Başarısız</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-blue-700">Başarı Oranı</div>
              </div>
            </div>

            {/* Failed Tests Alert */}
            {testResults.failedTests > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="font-medium text-red-800">
                    Başarısız Testler ({testResults.failedTests})
                  </h3>
                </div>
                <div className="space-y-2">
                  {testResults.results.filter(r => !r.passed).map((result, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <strong>{result.testName}:</strong> {result.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Results */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Detaylı Sonuçlar</h3>
              {testResults.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.passed)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.passed)}
                      <span className="font-medium">{result.testName}</span>
                    </div>
                    <Badge variant={result.passed ? 'success' : 'error'}>
                      {result.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                  {result.details && (
                    <details>
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        Teknik Detaylar
                      </summary>
                      <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntegrationTestsPage;