import React from 'react';
import { GoogleMapsTest } from '../../components/test/GoogleMapsTest';

const GoogleMapsTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Google Maps API Test Merkezi
          </h1>
          <p className="text-gray-600">
            Google Maps entegrasyonunu test edin ve API durumunu kontrol edin
          </p>
        </div>
        
        <GoogleMapsTest />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Bu sayfa sadece test amaçlıdır. Üretim ortamında kaldırılacaktır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsTestPage;
