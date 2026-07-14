import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import settingsReducer, { updateLocalSettings, saveSettings, resetSettings } from '../settingsSlice';
import { coursesApi } from '../coursesApi';
import authReducer, { setCredentials, logout, updateUser } from './features/auth/authSlice';

const listenerMiddleware = createListenerMiddleware();

// Add a listener to handle automatic saving
listenerMiddleware.startListening({
  actionCreator: updateLocalSettings,
  effect: async (action, listenerApi) => {
    // Cancel any pending save tasks from previous changes (debouncing)
    listenerApi.cancelActiveListeners();
    
    // Wait for 1 second of inactivity before triggering the save
    await listenerApi.delay(1000);
    
    const currentSettings = listenerApi.getState().settings.data;
    listenerApi.dispatch(saveSettings(currentSettings));
  },
});

// Listener for persisting auth state to localStorage
listenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    const { token, user } = action.payload;
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
});

listenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
});

listenerMiddleware.startListening({
  actionCreator: updateUser,
  effect: (action, listenerApi) => {
    const { auth } = listenerApi.getState();
    if (auth.user) {
      localStorage.setItem('user', JSON.stringify(auth.user));
    }
  },
});

listenerMiddleware.startListening({
  matcher: (action) => [updateLocalSettings.type, resetSettings.type, saveSettings.fulfilled.type].includes(action.type),
  effect: (action, listenerApi) => {
    const settings = listenerApi.getState().settings.data;
    localStorage.setItem('user-settings', JSON.stringify(settings));
  }
});

const loadStateFromStorage = () => {
  try {
    const preloadedState = {};
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const settingsString = localStorage.getItem('user-settings');

    if (token && userString) {
      const user = JSON.parse(userString);
      preloadedState.auth = {
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    }

    if (settingsString) {
      const settings = JSON.parse(settingsString);
      preloadedState.settings = {
        data: settings,
        status: 'idle',
        error: null,
      };
    }

    return Object.keys(preloadedState).length > 0 ? preloadedState : undefined;
  } catch (e) {
    console.error('Could not load state from localStorage', e);
    // If parsing fails, clear potentially corrupted data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user-settings');
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
  },
  preloadedState: loadStateFromStorage(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(coursesApi.middleware),
});