import React from 'react';
import { Button } from '../ui';

interface Props {
  show: boolean;
  message: string;
  upgradeHref?: string;
  onUpgrade?: () => void;
}

export const SubscriptionLimitBanner: React.FC<Props> = ({ show, message, upgradeHref = '/subscription', onUpgrade }) => {
  if (!show) return null;
  const handleClick = () => {
    if (onUpgrade) return onUpgrade();
    window.location.assign(upgradeHref);
  };
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md flex items-center justify-between">
      <div className="text-sm">
        <strong>Limit aşıldı:</strong> {message}
      </div>
      <Button variant="primary" onClick={handleClick}>Planı Yükselt</Button>
    </div>
  );
};

export default SubscriptionLimitBanner;


