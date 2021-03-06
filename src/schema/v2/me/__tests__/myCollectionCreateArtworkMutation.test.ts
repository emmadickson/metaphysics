import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const newArtwork = { id: "some-artwork-id" }
const createArtworkLoader = jest.fn().mockResolvedValue(newArtwork)

const artworkDetails = { medium: "Painting" }
const artworkLoader = jest.fn().mockResolvedValue(artworkDetails)

const createImageLoader = jest.fn()

const computeMutationInput = (externalImageUrls: string[] = []): string => {
  const mutation = gql`
    mutation {
      myCollectionCreateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          date: "1990"
          depth: "20"
          editionNumber: "1"
          editionSize: "10x10x10"
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          height: "20"
          medium: "Painting"
          metric: "in"
          title: "hey now"
          width: "20"
        }
      ) {
        artworkOrError {
          ... on MyCollectionArtworkMutationSuccess {
            artwork {
              medium
            }
            artworkEdge {
              node {
                medium
              }
            }
          }
          ... on MyCollectionArtworkMutationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  return mutation
}

const defaultContext = {
  myCollectionCreateArtworkLoader: createArtworkLoader,
  myCollectionArtworkLoader: artworkLoader,
  myCollectionCreateImageLoader: createImageLoader,
}

describe("myCollectionCreateArtworkMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when the server responds with an error", () => {
    it("returns that error", async () => {
      const mutation = computeMutationInput()

      const serverError = "Error creating artwork"
      const url =
        "https://stagingapi.artsy.net/api/v1/my_collection?id=some-artwork-id"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        myCollectionCreateArtworkLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionCreateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })
  })

  describe("when the server response is successful", () => {
    it("returns details of the new artwork", async () => {
      const mutation = computeMutationInput()

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toEqual({
        artwork: {
          medium: "Painting",
        },
        artworkEdge: {
          node: {
            medium: "Painting",
          },
        },
      })
    })
  })

  describe("creating additional images", () => {
    it("does nothing when there are no image urls", async () => {
      const mutation = computeMutationInput([])

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).not.toBeCalled()
    })

    it("does nothing with an image url that doesn't match", async () => {
      const externalImageUrls = ["http://example.com/path/to/image.jpg"]
      const mutation = computeMutationInput(externalImageUrls)

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).not.toBeCalled()
    })

    it("creates an additional image with bucket and key with a valid image url", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput(externalImageUrls)

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })
    })

    it("returns an error when the additional image can't be created", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput(externalImageUrls)

      const serverError = "Error creating image"
      const url =
        "https://stagingapi.artsy.net/api/v1/artwork/some-artwork-id/images"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        myCollectionCreateImageLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionCreateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })

    it("tries to create each image even if some are invalid", async () => {
      const externalImageUrls = [
        "http://example.com/path/to/image.jpg",
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput(externalImageUrls)

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionCreateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(newArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })
    })
  })
})
