import React from 'react';
import SettingsSidebar from '@/components/SettingsSidebar';

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <SettingsSidebar isOpen={true} onClose={() => {}} />
    </div>
  );
}