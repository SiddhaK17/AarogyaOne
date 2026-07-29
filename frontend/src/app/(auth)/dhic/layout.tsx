'use client';

import { ReactNode, useEffect } from "react";
import { useRouter } from 'next/navigation';
import "@/index.css";
import { DistrictProvider } from "@/context/DistrictContext";
import Layout from "@/components/Layout";
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';

export default function DhicLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  const router = useRouter();

  const hasCookie = typeof document !== 'undefined' && document.cookie.includes('aarogya_token=');

  useEffect(() => {
    if (!loading && !user && !hasCookie) {
      router.replace('/login?role=dhic');
    }
  }, [user, loading, router, hasCookie]);

  if (!user && !loading && !hasCookie) {
    return null; // useEffect above handles redirect
  }

  if (loading && !hasCookie) {
    return <PageLoader message="Authenticating DHIC session..." />;
  }

  return (
    <DistrictProvider>
      <Layout>{children}</Layout>
    </DistrictProvider>
  );
}
