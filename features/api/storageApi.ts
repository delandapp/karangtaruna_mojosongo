import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const EXTERNAL_API_KEY = process.env.NEXT_PUBLIC_S3_API_KEY || 'ee85bc2458dd47f24b78f019add255280ee8689455cdead0f22e1bcdf73c8b07';

export const storageApi = createApi({
  reducerPath: 'storageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_S3_API_URL || 'http://localhost:4020/api/v1/',
    prepareHeaders: (headers) => {
      headers.set('x-api-key', EXTERNAL_API_KEY);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<
      { success: boolean; message: string; data: any },
      { bucketName: string; file: File }
    >({
      query: ({ bucketName, file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: `buckets/${bucketName}/upload`,
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadFileMutation } = storageApi;
