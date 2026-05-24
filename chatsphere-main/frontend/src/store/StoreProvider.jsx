import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  auth: null,
  activeChat: null,
  onlineUsers: [],
  call: { status: 'idle', peer: null },
  theme: typeof window !== 'undefined' && window.localStorage?.getItem('theme') ? window.localStorage.getItem('theme') : 'light',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, auth: action.payload };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUsers: action.payload };
    case 'SET_CALL_STATE':
      return { ...state, call: { ...state.call, ...action.payload } };
    case 'SET_THEME':
      if (typeof window !== 'undefined') window.localStorage.setItem('theme', action.payload);
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children, initial = {} }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial });
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export default StoreProvider;
