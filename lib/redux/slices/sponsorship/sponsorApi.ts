import { apiSlice } from "../../apiSlice";

export const sponsorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSponsors: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.m_kategori_sponsor_id)
          queryParams.append("m_kategori_sponsor_id", params.m_kategori_sponsor_id.toString());
        return `/sponsorship/sponsors?${queryParams.toString()}`;
      },
      providesTags: ["Sponsor"],
    }),
    getSponsorById: builder.query({
      query: (id) => `/sponsorship/sponsors/${id}`,
      providesTags: (result, error, id) => [{ type: "Sponsor", id }],
    }),
    createSponsor: builder.mutation({
      query: (data) => ({
        url: "/sponsorship/sponsors",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Sponsor"],
    }),
    updateSponsor: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sponsorship/sponsors/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Sponsor", id }, "Sponsor"],
    }),
    deleteSponsor: builder.mutation({
      query: (id) => ({
        url: `/sponsorship/sponsors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sponsor"],
    }),
  }),
});

export const {
  useGetSponsorsQuery,
  useGetSponsorByIdQuery,
  useCreateSponsorMutation,
  useUpdateSponsorMutation,
  useDeleteSponsorMutation,
} = sponsorApi;
