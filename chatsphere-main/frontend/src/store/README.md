Store scaffolding

- `StoreProvider.jsx` provides a small reducer-based global store as a compatibility layer.
- Recommended migration path: introduce Redux Toolkit slices behind `useStore` adapters.

Example usage:
import StoreProvider, { useStore } from 'store/StoreProvider';

function App(){
  return <StoreProvider><AppRoutes/></StoreProvider>
}

function Component(){
  const { state, dispatch } = useStore();
  // dispatch({ type: 'SET_AUTH', payload: user });
}
