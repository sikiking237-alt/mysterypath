// frontend/src/features/settings/settingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call, e.g., await api.saveSettings(settings)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const defaultSettings = {
  theme: 'light',
  notifications: true,
  fontSize: 'medium',
  emailNotifications: true,
  pushNotifications: false,
};

const initialState = {
  data: defaultSettings,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateLocalSettings(state, action) {
      // This reducer is now pure, only updating the state
      state.data = { ...state.data, ...action.payload };
    },
    resetSettings(state) {
      state.data = defaultSettings;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { updateLocalSettings, resetSettings } = settingsSlice.actions;

export const selectSettings = (state) => state.settings?.data ?? defaultSettings;
export const selectSettingsStatus = (state) => state.settings?.status ?? 'idle';
export const selectSettingsError = (state) => state.settings?.error ?? null;
export const selectFontSize = (state) => state.settings?.data?.fontSize ?? 'medium';
export const selectTheme = (state) => state.settings?.data?.theme ?? 'light';

export default settingsSlice.reducer;