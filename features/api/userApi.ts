import { buildQueryParams } from "@/utils/helpers/url-helpers";
import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                const url = buildQueryParams("/users", params || undefined);
                return { url, method: "GET" };
            },
            providesTags: ["User"],
        }),
        createUser: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/users",
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),
        updateUser: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/users/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["User"],
        }),
        deleteUser: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/users/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = userApi;
