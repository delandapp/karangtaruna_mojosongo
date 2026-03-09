import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const userApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/users";
                if (params) {
                    const searchParams = new URLSearchParams();
                    if (params.page) searchParams.append("page", params.page.toString());
                    if (params.limit) searchParams.append("limit", params.limit.toString());
                    if (params.search) searchParams.append("search", params.search);
                    if (params.filter?.dropdown) searchParams.append("dropdown", "true");
                    if (params.m_jabatan_id) searchParams.append("m_jabatan_id", params.m_jabatan_id.toString());
                    const qs = searchParams.toString();
                    if (qs) url += `?${qs}`;
                }
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
