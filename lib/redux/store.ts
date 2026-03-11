import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import authReducer from "./slices/authSlice";

import { organisasiApi } from "@/features/api/organisasiApi";
import { eventApi } from "@/features/api/eventApi";
import { panitiaApi } from "@/features/api/panitiaApi";
import { rundownApi } from "@/features/api/rundownApi";
import { tugasApi } from "@/features/api/tugasApi";
import { rapatApi } from "@/features/api/rapatApi";
import { anggaranApi } from "@/features/api/anggaranApi";
import { keuanganApi } from "@/features/api/keuanganApi";

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        [organisasiApi.reducerPath]: organisasiApi.reducer,
        [eventApi.reducerPath]: eventApi.reducer,
        [panitiaApi.reducerPath]: panitiaApi.reducer,
        [rundownApi.reducerPath]: rundownApi.reducer,
        [tugasApi.reducerPath]: tugasApi.reducer,
        [rapatApi.reducerPath]: rapatApi.reducer,
        [anggaranApi.reducerPath]: anggaranApi.reducer,
        [keuanganApi.reducerPath]: keuanganApi.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            apiSlice.middleware,
            organisasiApi.middleware,
            eventApi.middleware,
            panitiaApi.middleware,
            rundownApi.middleware,
            tugasApi.middleware,
            rapatApi.middleware,
            anggaranApi.middleware,
            keuanganApi.middleware
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
