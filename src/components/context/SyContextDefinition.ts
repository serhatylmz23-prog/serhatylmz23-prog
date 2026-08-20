import { createContext } from 'react';
import type { SyContextValue } from './SyContext';

export const SyContext = createContext<
  SyContextValue | undefined
>(undefined);
