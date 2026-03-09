import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const jabatanApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getJabatans: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/jabatans";
                if (params) {
                    const searchParams = new URLSearchParams();
                    if (params.page) searchParams.append("page", params.page.toString());
                    if (params.limit) searchParams.append("limit", params.limit.toString());
                    if (params.search) searchParams.append("search", params.search);
                    if (params.filter?.dropdown) searchParams.append("dropdown", "true");
                    const qs = searchParams.toString();
                    if (qs) url += `?${qs}`;
                }
                return { url, method: "GET" };
            },
            providesTags: ["Jabatan"],
        }),
        createJabatan: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/jabatans",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Jabatan"],
        }),
        updateJabatan: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/jabatans/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Jabatan"],
        }),
        deleteJabatan: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/jabatans/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Jabatan"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetJabatansQuery,
    useCreateJabatanMutation,
    useUpdateJabatanMutation,
    useDeleteJabatanMutation
} = jabatanApi;
