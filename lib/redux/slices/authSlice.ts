import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    token: string | null;
    user: any | null;
}

// In a real app we might initialize this lazily if loading from cookies in client.
const initialState: AuthState = {
    token: null,
    user: null,
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: any; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
