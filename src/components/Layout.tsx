
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';
import { OptimizedLoadingScreen } from '@/components/shared/OptimizedLoadingScreen';
import Navbar from './Navbar';
import { BottomNavigation } from './BottomNavigation';
import { LayoutWrapper } from './layout/LayoutWrapper';
import { LayoutContainer } from './layout/LayoutContainer';
import { useModalState } from '@/hooks/useModalState';
import { useOnboarding } from '@/hooks/auth/useOnboarding';
import { OnboardingDialog } from '@/components/onboarding/OnboardingDialog';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

const Layout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [pageTransition, setPageTransition] = useState(false);
  const { user, loading } = useAuth();
  const { isModalOpen } = useModalState();
  const { showOnboarding } = useOnboarding(user);
  
  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  console.log('Layout: loading =', loading, 'user =', !!user);

  if (loading) {
    return <OptimizedLoadingScreen message="Loading app..." />;
  }

  if (!user) {
    console.log('Layout: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('Layout: User authenticated, rendering app');

  return (
    <LayoutWrapper>
      <OfflineIndicator />
      <Navbar />
      <LayoutContainer 
        isMobile={isMobile} 
        pageTransition={pageTransition}
      >
        <Outlet />
      </LayoutContainer>
      {isMobile && <BottomNavigation />}
      {showOnboarding && <OnboardingDialog open={showOnboarding} />}
    </LayoutWrapper>
  );
};

export default Layout;
