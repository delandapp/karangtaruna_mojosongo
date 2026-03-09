import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse } from "@/lib/types/api.types";
import { setCredentials, logout } from "@/lib/redux/slices/authSlice";

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<
            ApiResponse<{ user: any; token: string }>,
            Record<string, any>
        >({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // When login is successful, store standard RTK token/user state
                    dispatch(
                        setCredentials({
                            user: data.data.user,
                            token: data.data.token,
                        })
                    );
                } catch (error) {
                    // Handle error if necessary
                }
            },
        }),
        register: builder.mutation<ApiResponse<any>, Record<string, any>>({
            query: (userData) => ({
                url: "/auth/register",
                method: "POST",
                body: userData,
            }),
        }),
        logoutUser: builder.mutation<ApiResponse<any>, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(logout()); // Clear Redux state on successful logout API
                } catch (error) {
                    // Force logout even if API fails
                    dispatch(logout());
                }
            },
        }),
    }),
    overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation, useLogoutUserMutation } =
    authApi;
