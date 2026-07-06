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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?role=dhic');
    }
  }, [user, loading, router]);

  if (!user && !loading) {
    return null; // useEffect above handles redirect
  }

  if (loading) {
    return <PageLoader message="Authenticating DHIC session..." />;
  }

  return (
    <DistrictProvider>
      <Layout>{children}</Layout>
    </DistrictProvider>
  );
}
