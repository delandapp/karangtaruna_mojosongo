import { buildQueryParams } from "@/utils/helpers/url-helpers";
import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const bidangBrandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBidangBrands: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                const url = buildQueryParams("/sponsorship/bidang-brand", params || undefined);
                return { url, method: "GET" };
            },
            providesTags: ["BidangBrand"],
        }),
        createBidangBrand: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/sponsorship/bidang-brand",
                method: "POST",
                body,
            }),
            invalidatesTags: ["BidangBrand"],
        }),
        updateBidangBrand: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/sponsorship/bidang-brand/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["BidangBrand"],
        }),
        deleteBidangBrand: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/sponsorship/bidang-brand/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["BidangBrand"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetBidangBrandsQuery,
    useCreateBidangBrandMutation,
    useUpdateBidangBrandMutation,
    useDeleteBidangBrandMutation,
} = bidangBrandApi;
