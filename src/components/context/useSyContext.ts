import { useContext } from 'react';
import type { SyContextValue } from './SyContext';
import { SyContext } from './SyContextDefinition';

export function useSyContext(): SyContextValue {
  const context = useContext(SyContext);

  if (!context) {
    throw new Error(
      'useSyContext yalnızca SyProvider içerisinde kullanılabilir.'
    );
  }

  return context;
}
