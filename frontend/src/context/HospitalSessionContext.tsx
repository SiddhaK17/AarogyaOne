'use client';

import React, { createContext, useContext } from 'react';
import type { ActiveHospitalSession } from '@/context/AppDataContext';

interface HospitalSessionContextValue {
  session: ActiveHospitalSession | null;
}

export const HospitalSessionContext = createContext<HospitalSessionContextValue>({ session: null });

export function useHospitalSession() {
  return useContext(HospitalSessionContext);
}
