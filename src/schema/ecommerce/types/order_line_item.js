import { GraphQLID, GraphQLInt, GraphQLObjectType } from "graphql"
import { connectionDefinitions } from "graphql-relay"
import Artwork from "schema/artwork"
import EditionSet from "schema/edition_set"
import { amount } from "schema/fields/money"
import date from "schema/fields/date"

export const OrderLineItemType = new GraphQLObjectType({
  name: "OrderLineItem",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order line item",
    },
    artwork: {
      type: Artwork.type,
      description: "Artwork that is being ordered",
      resolve: (
        { artworkId },
        _args,
        _context,
        { rootValue: { artworkLoader } }
      ) => artworkLoader(artworkId),
    },
    editionSet: {
      type: EditionSet.type,
      description: "Edition set on the artwork",
      resolve: ({ editionSetId }) => editionSetId,
    },
    price: amount(({ priceCents }) => priceCents),
    updatedAt: date,
    createdAt: date,
    quantity: {
      type: GraphQLInt,
      description: "Quantity of items in this line item",
    },
  }),
})

export const {
  connectionType: OrderLineItemConnection,
  edgeType: OrderLineItemEdge,
} = connectionDefinitions({
  nodeType: OrderLineItemType,
})