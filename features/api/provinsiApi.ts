import { apiSlice } from "@/lib/redux/apiSlice";
import { ApiResponse, ApiQueryParams } from "@/lib/types/api.types";

export const provinsiApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProvinsi: builder.query<ApiResponse<any[]>, ApiQueryParams | void>({
            query: (params) => {
                let url = "/wilayah/provinsi";
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
            providesTags: ["Provinsi"],
        }),
        createProvinsi: builder.mutation<ApiResponse<any>, Partial<any>>({
            query: (body) => ({
                url: "/wilayah/provinsi",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Provinsi"],
        }),
        updateProvinsi: builder.mutation<ApiResponse<any>, { id: number; data: Partial<any> }>({
            query: ({ id, data }) => ({
                url: `/wilayah/provinsi/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Provinsi"],
        }),
        deleteProvinsi: builder.mutation<ApiResponse<any>, number>({
            query: (id) => ({
                url: `/wilayah/provinsi/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Provinsi"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetProvinsiQuery,
    useCreateProvinsiMutation,
    useUpdateProvinsiMutation,
    useDeleteProvinsiMutation,
} = provinsiApi;
