import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export interface KotaQueryParams extends ApiQueryParams {
  m_provinsi_id?: number | string;
}

export const kotaApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getKota: builder.query<ApiResponse<any[]>, KotaQueryParams | void>({
            query: (params) => {
                let url = "/wilayah/kota";
                if (params) {
                    const searchParams = new URLSearchParams();
                    if (params.page) searchParams.append("page", params.page.toString());
                    if (params.limit) searchParams.append("limit", params.limit.toString());
                    if (params.search) searchParams.append("search", params.search);
                    if (params.filter?.dropdown) searchParams.append("dropdown", "true");
                    if (params.m_provinsi_id) searchParams.append("m_provinsi_id", params.m_provinsi_id.toString());
                    const qs = searchParams.toString();
                    if (qs) url += `?${qs}`;
                }
                return { url, method: "GET" };
            },
            providesTags: ["Kota"],
        }),
        createKota: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/wilayah/kota",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Kota", "Kecamatan"],
        }),
        updateKota: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/wilayah/kota/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Kota", "Kecamatan"],
        }),
        deleteKota: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/wilayah/kota/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Kota"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetKotaQuery,
    useCreateKotaMutation,
    useUpdateKotaMutation,
    useDeleteKotaMutation,
} = kotaApi;
