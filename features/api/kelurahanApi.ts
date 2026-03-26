import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export interface KelurahanQueryParams extends ApiQueryParams {
  m_kecamatan_id?: number | string;
  m_kota_id?: number | string;
  m_provinsi_id?: number | string;
}

export const kelurahanApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getKelurahan: builder.query<ApiResponse<any[]>, KelurahanQueryParams | void>({
            query: (params) => {
                let url = "/wilayah/kelurahan";
                if (params) {
                    const searchParams = new URLSearchParams();
                    if (params.page) searchParams.append("page", params.page.toString());
                    if (params.limit) searchParams.append("limit", params.limit.toString());
                    if (params.search) searchParams.append("search", params.search);
                    if (params.filter?.dropdown) searchParams.append("dropdown", "true");
                    if (params.m_kecamatan_id) searchParams.append("m_kecamatan_id", params.m_kecamatan_id.toString());
                    if (params.m_kota_id) searchParams.append("m_kota_id", params.m_kota_id.toString());
                    if (params.m_provinsi_id) searchParams.append("m_provinsi_id", params.m_provinsi_id.toString());
                    const qs = searchParams.toString();
                    if (qs) url += `?${qs}`;
                }
                return { url, method: "GET" };
            },
            providesTags: ["Kelurahan"],
        }),
        createKelurahan: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/wilayah/kelurahan",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Kelurahan"],
        }),
        updateKelurahan: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/wilayah/kelurahan/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Kelurahan"],
        }),
        deleteKelurahan: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/wilayah/kelurahan/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Kelurahan"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetKelurahanQuery,
    useCreateKelurahanMutation,
    useUpdateKelurahanMutation,
    useDeleteKelurahanMutation,
} = kelurahanApi;
