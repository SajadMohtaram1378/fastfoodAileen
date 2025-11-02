
const s3 = {
  upload: jest.fn().mockReturnValue({
    promise: async () => ({
      Location: "https://mocked.arvanstorage.ir/test/image.png",
      Key: "test/image.png",
    }),
  }),

  deleteObject: jest.fn().mockReturnValue({
    promise: async () => ({}),
  }),

  getSignedUrlPromise: jest.fn(async () => "https://mocked-signed-url.com"),
};

export default s3;
