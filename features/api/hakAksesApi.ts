import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const hakAksesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getHakAkses: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/hak-akses";
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
            providesTags: ["HakAkses"],
        }),
        createHakAkses: builder.mutation<ApiResponse<any>, Partial<any>[]>({
            query: (body) => ({
                url: "/hak-akses",
                method: "POST",
                body,
            }),
            invalidatesTags: ["HakAkses"],
        }),
        updateHakAkses: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/hak-akses/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["HakAkses"],
        }),
        deleteHakAkses: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/hak-akses/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["HakAkses"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetHakAksesQuery,
    useCreateHakAksesMutation,
    useUpdateHakAksesMutation,
    useDeleteHakAksesMutation
} = hakAksesApi;
