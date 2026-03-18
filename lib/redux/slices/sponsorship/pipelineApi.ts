import { apiSlice } from "../../apiSlice";

export const pipelineApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSponsorPipelines: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.event_id) queryParams.append("event_id", params.event_id.toString());
        return `/sponsorship/pipelines?${queryParams.toString()}`;
      },
      providesTags: ["SponsorPipeline"],
    }),
    getPipelineById: builder.query({
      query: (id) => `/sponsorship/pipelines/${id}`,
      providesTags: (result, error, id) => [{ type: "SponsorPipeline", id }],
    }),
    createPipeline: builder.mutation({
      query: (data) => ({
        url: "/sponsorship/pipelines",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SponsorPipeline"],
    }),
    updatePipeline: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sponsorship/pipelines/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "SponsorPipeline", id }, "SponsorPipeline", "Sponsor"], // Might affect Sponsor stats
    }),
    deletePipeline: builder.mutation({
      query: (id) => ({
        url: `/sponsorship/pipelines/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SponsorPipeline"],
    }),
  }),
});

export const {
  useGetSponsorPipelinesQuery,
  useGetPipelineByIdQuery,
  useCreatePipelineMutation,
  useUpdatePipelineMutation,
  useDeletePipelineMutation,
} = pipelineApi;
