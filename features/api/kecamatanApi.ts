import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export interface KecamatanQueryParams extends ApiQueryParams {
  m_kota_id?: number | string;
  m_provinsi_id?: number | string;
}

export const kecamatanApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getKecamatan: builder.query<ApiResponse<any[]>, KecamatanQueryParams | void>({
            query: (params) => {
                let url = "/wilayah/kecamatan";
                if (params) {
                    const searchParams = new URLSearchParams();
                    if (params.page) searchParams.append("page", params.page.toString());
                    if (params.limit) searchParams.append("limit", params.limit.toString());
                    if (params.search) searchParams.append("search", params.search);
                    if (params.filter?.dropdown) searchParams.append("dropdown", "true");
                    if (params.m_kota_id) searchParams.append("m_kota_id", params.m_kota_id.toString());
                    if (params.m_provinsi_id) searchParams.append("m_provinsi_id", params.m_provinsi_id.toString());
                    const qs = searchParams.toString();
                    if (qs) url += `?${qs}`;
                }
                return { url, method: "GET" };
            },
            providesTags: ["Kecamatan"],
        }),
        createKecamatan: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/wilayah/kecamatan",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Kecamatan", "Kelurahan"],
        }),
        updateKecamatan: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/wilayah/kecamatan/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Kecamatan", "Kelurahan"],
        }),
        deleteKecamatan: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/wilayah/kecamatan/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Kecamatan"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetKecamatanQuery,
    useCreateKecamatanMutation,
    useUpdateKecamatanMutation,
    useDeleteKecamatanMutation,
} = kecamatanApi;
