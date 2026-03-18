import { apiSlice } from "../../apiSlice";

export const proposalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProposals: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.event_id) queryParams.append("event_id", params.event_id.toString());
        return `/sponsorship/proposals?${queryParams.toString()}`;
      },
      providesTags: ["SponsorProposal"],
    }),
    getProposalById: builder.query({
      query: (id) => `/sponsorship/proposals/${id}`,
      providesTags: (result, error, id) => [{ type: "SponsorProposal", id }],
    }),
    createProposal: builder.mutation({
      query: (data) => ({
        url: "/sponsorship/proposals",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SponsorProposal"],
    }),
    updateProposal: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sponsorship/proposals/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "SponsorProposal", id }, "SponsorProposal"],
    }),
    deleteProposal: builder.mutation({
      query: (id) => ({
        url: `/sponsorship/proposals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SponsorProposal"],
    }),
  }),
});

export const {
  useGetProposalsQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useDeleteProposalMutation,
} = proposalApi;
