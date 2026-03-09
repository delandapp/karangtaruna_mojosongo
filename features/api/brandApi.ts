import { buildQueryParams } from "@/utils/helpers/url-helpers";
import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const brandApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBrands: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                const url = buildQueryParams("/sponsorship/brand", params || undefined);
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
