import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const storageApi = createApi({
  reducerPath: "storageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/storage/",
  }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<
      { success: boolean; message: string; data: any },
      { bucketName: string; file: File }
    >({
      query: ({ bucketName, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `buckets/${bucketName}/upload`,
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadFileMutation } = storageApi;
