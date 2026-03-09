import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const brandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBrands: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/sponsorship/brand";
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
            providesTags: ["Brand"],
        }),
        createBrand: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/sponsorship/brand",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Brand"],
        }),
    }),
    overrideExisting: false,
});

export const { useGetBrandsQuery, useCreateBrandMutation } = brandApi;
