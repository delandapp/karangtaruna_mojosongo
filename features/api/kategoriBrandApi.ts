import { buildQueryParams } from "@/utils/helpers/url-helpers";
import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const kategoriBrandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getKategoriBrands: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                const url = buildQueryParams("/sponsorship/kategori-brand", params || undefined);
                return { url, method: "GET" };
            },
            providesTags: ["KategoriBrand"],
        }),
        createKategoriBrand: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/sponsorship/kategori-brand",
                method: "POST",
                body,
            }),
            invalidatesTags: ["KategoriBrand"],
        }),
        updateKategoriBrand: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/sponsorship/kategori-brand/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["KategoriBrand"],
        }),
        deleteKategoriBrand: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/sponsorship/kategori-brand/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["KategoriBrand"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetKategoriBrandsQuery,
    useCreateKategoriBrandMutation,
    useUpdateKategoriBrandMutation,
    useDeleteKategoriBrandMutation,
} = kategoriBrandApi;
