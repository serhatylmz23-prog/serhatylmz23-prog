import { useContext } from 'react';
import { LiveRuntimeContext } from './LiveRuntimeContextDefinition';

export function useLiveRuntime() {
  const value = useContext(LiveRuntimeContext);
  if (!value) {
    throw new Error(
      'useLiveRuntime yalnızca LiveRuntimeProvider içinde kullanılabilir.'
    );
  }
  return value;
}
