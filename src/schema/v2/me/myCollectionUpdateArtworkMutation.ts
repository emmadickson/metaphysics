import { GraphQLString, GraphQLList, GraphQLNonNull, GraphQLInt } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { MyCollectionArtworkMutationType } from "./myCollection"
import { formatGravityError } from "lib/gravityErrorHandler"

export const myCollectionUpdateArtworkMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MyCollectionUpdateArtwork",
  description: "Update an artwork in my collection",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artistIds: {
      type: new GraphQLList(GraphQLString),
    },
    category: {
      type: GraphQLString,
    },
    costCurrencyCode: {
      type: GraphQLString,
    },
    costMinor: {
      type: GraphQLInt,
    },
    date: {
      type: GraphQLString,
    },
    depth: {
      type: GraphQLString,
    },
    editionNumber: {
      type: GraphQLString,
    },
    editionSize: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLString,
    },
    medium: {
      type: GraphQLString,
    },
    metric: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    width: {
      type: GraphQLString,
    },
  },
  outputFields: {
    artworkOrError: {
      type: MyCollectionArtworkMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    {
      artworkId,
      artistIds,
      costCurrencyCode,
      costMinor,
      editionNumber,
      editionSize,
      ...rest
    },
    { myCollectionUpdateArtworkLoader }
  ) => {
    if (!myCollectionUpdateArtworkLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await myCollectionUpdateArtworkLoader(artworkId, {
        artists: artistIds,
        cost_currency_code: costCurrencyCode,
        cost_minor: costMinor,
        edition_number: editionNumber,
        edition_size: editionSize,
        ...rest,
      })

      return {
        ...response,
        id: artworkId,
      }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
