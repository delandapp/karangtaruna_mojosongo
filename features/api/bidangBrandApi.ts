import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const bidangBrandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBidangBrands: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/sponsorship/bidang-brand";
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
    }),
    overrideExisting: false,
});

export const { useGetBidangBrandsQuery, useCreateBidangBrandMutation } =
    bidangBrandApi;
