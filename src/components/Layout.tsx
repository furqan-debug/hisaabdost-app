
import React, { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';
import { OptimizedLoadingScreen } from '@/components/shared/OptimizedLoadingScreen';
import Navbar from './Navbar';
import { BottomNavigation } from './BottomNavigation';
import { LayoutWrapper } from './layout/LayoutWrapper';
import { LayoutContainer } from './layout/LayoutContainer';
import { useOnboarding } from '@/hooks/auth/useOnboarding';
import { OnboardingDialog } from '@/components/onboarding/OnboardingDialog';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

const Layout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { showOnboarding } = useOnboarding(user);
  
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
      <LayoutContainer isMobile={isMobile}>
        <Outlet />
      </LayoutContainer>
      {isMobile && <BottomNavigation />}
      {(location.pathname === '/app' || location.pathname.startsWith('/app/dashboard')) && showOnboarding && <OnboardingDialog open={showOnboarding} />}
    </LayoutWrapper>
  );
};

export default Layout;
