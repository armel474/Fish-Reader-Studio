'use client';

import React, {useState} from 'react';
import CommercialMobileAppExperience from '@/components/CommercialMobileAppExperience';
import {FrThemeId} from '@/lib/fishreader-ds';

export default function HomePage() {
  const [themeId, setThemeId] = useState<FrThemeId>('papier');

  return (
    <CommercialMobileAppExperience
      themeId={themeId}
      onThemeChange={setThemeId}
    />
  );
}
