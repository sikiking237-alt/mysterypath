// src/store/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import settingsReducer from '../../settingsSlice.js'
import { coursesApi } from '../features/courses/coursesApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(coursesApi.middleware),
})

export default store
