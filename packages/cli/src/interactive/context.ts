import React, { createContext, useContext, useReducer } from 'react';
import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction } from './parser/types';

export interface AppState {
  history: string[];
  context: {
    lastAction?: ParsedAction;
  };
}

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  client: NexwaveClient;
}

export type AppAction =
  | { type: 'ADD_HISTORY'; payload: string }
  | { type: 'SET_CONTEXT'; payload: { lastAction?: ParsedAction } }
  | { type: 'CLEAR_HISTORY' };

export const initialState: AppState = {
  history: [],
  context: {},
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [...state.history, action.payload].slice(-100), // Keep last 100
      };
    case 'SET_CONTEXT':
      return {
        ...state,
        context: {
          ...state.context,
          ...action.payload,
        },
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };
    default:
      return state;
  }
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContext.Provider');
  }
  return context;
}
