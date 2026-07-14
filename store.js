import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import settingsReducer, { updateLocalSettings, saveSettings } from './settingsSlice';
import { coursesApi } from './coursesApi';
import authReducer from './features/auth/authSlice';

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

export const store = configureStore({
  reducer: {
    // Integration of the settings slice
    auth: authReducer,
    settings: settingsReducer,
    // Integration of the RTK Query API
    [coursesApi.reducerPath]: coursesApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of RTK Query.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(coursesApi.middleware),
});