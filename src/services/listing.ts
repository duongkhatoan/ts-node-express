import { Request, Response } from "express";
import validateNewListing from "~/validators/listing/newListing";
import { handleSlug, tryParseJSON } from "~/helpers/utils";
import { orderByField as buildMysqlOrders } from "~/helpers/buildMongoOrder";
import buildMongoFilter from "~/helpers/buildMongoFilter";
import websocket from '~/libs/WebSocket'


interface Context {
    user: {
        id: string,
    };
    client: any,
}
type RequestContext = Request & { context: Context };

interface IListingParams {
    guestCount_gte?: number,
    roomCount_gte?: number,
    bathroomCount_gte?: number,
    startDate_gte?: Date,
    endDate_lte?: Date,
    locationValue?: string
    price?: number
    category?: string
    title?: string
    description?: string
    NOT?: any
}

export default {
    // GET: /api/categories
    list: async (req: any, res: any) => {
        const { filter, includes, sort, limit, skip = 0 } = req.query

        try {
            const parsedFilter: IListingParams = tryParseJSON(filter)

            const parsedSort = tryParseJSON(sort)

            // console.log(parsedSort);
            const parsedIncludes = tryParseJSON(includes)
            const options: { take?: number, orderBy?: any, skip: number } = {
                skip: Number(skip),
            }

            if (limit) {
                options.take = Number(limit)
            }

            if (parsedSort) {
                options.orderBy = buildMysqlOrders(parsedSort)
                console.log(options.orderBy);
            }

            const { context } = req;
            const { client } = context || {};

            const listings = await client.listing.findMany({
                where: buildMongoFilter(parsedFilter, true),
                include: parsedIncludes,
                ...options,
            });

            const totalListings = await client.listing.count({
                where: buildMongoFilter(parsedFilter, true),
            });


            const hasMore = totalListings > options.skip + listings.length;

            return res.json({
                success: true,
                data: listings,
                count: totalListings,
                hasMore,
            });
        } catch (error) {
            console.error(
                "Error occurred while fetching listings from database:",
                error
            );

            return res.json({ success: false, message: "Error occurred while fetching listings" });
            throw new Error("Error occurred while fetching listings from database");
        }
    },
    // GET: /api/categories/:id
    view: async (req: any, res: any) => {

        try {
            const { filter, includes, sort, limit, skip = 0 } = req.query
            const listingId = req.params.id;
            console.log(listingId);
            const { context } = req;
            const { client } = context;
            const parsedIncludes = includes ? tryParseJSON(includes) : {}

            console.log(parsedIncludes.reservations.where.deletedAt);
            const response = await client.listing.findFirst(
                {
                    where: { id: listingId, deletedAt: { isSet: false } },
                    include: parsedIncludes
                }
            );
            return res.json({
                success: true,
                data: response,
            });
        } catch (error: any) {
            console.error(
                "Error occurred while fetching listingId from database:",
                error.message
            );
            throw new Error("Error occurred while fetching listingId from database");
        }
    },
    // POST: /api/categories/create
    create: async (req: any, res: any) => {
        try {
            const { client } = req.context || {};
            const args = req.body;
            const { error, value } = validateNewListing.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }

            const result = await client.listing.create({
                data: {
                    ...value,
                    userId: req.context?.user?.id,
                }
            })
            websocket.broadcastChange("Listings", "create", result)
            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error("Error occurred while creating post:", error);
            throw new Error("Error occurred while creating post");
        }
    },
    // PATCH: /api/posts/:id
    update: async (req: any, res: any) => {
        try {
            const { context } = req;
            const { client } = context;
            const { id } = req.params;
            const args = req.body;
            const { error, value } = validateNewListing.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }


            const currentListing = await client.listing.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentListing) {
                return res.status(404).json({
                    success: false,
                    message: "Listing not found",
                });
            }



            await client.listing.update(
                {
                    where: {
                        id
                    },
                    data: {
                        ...value
                    }
                }
            );

            return res.json({
                success: true,
                message: "Updated listing successfully",
            });
        } catch (error) {
            console.error("Error occurred while updating listing:", error);
            return res.json({ status: false, message: "Failed to update listing" })
            throw new Error("Error occurred while updating listing");
        }
    },
    // DELETE: /api/categories/:id
    delete: async (req: any, res: any) => {
        try {
            const { context, body } = req;
            const { client } = context;
            const { id } = req.params;



            const currentPost = await client.post.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentPost) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found",
                });
            }
            await client.post.update({
                where: {
                    id
                },
                data: {
                    deletedAt: new Date()
                }
            })
            return res.json({
                success: true,
                message: "Deleted post successfully",
            });
        } catch (error) {
            console.error("Error occurred while deleting post:", error);
            throw new Error("Error occurred while deleting post from database");
        }
    },
    // likePost: async (req: RequestContext, res: Response) => {
    //     try {
    //         const { context, body } = req;
    //         const { mongo } = context;
    //         const { id } = req.params;
    //         const { _id: userId } = context.user;
    //         const response = await getPost(id, context);
    //         if (!response.success) {
    //             return res.status(404).json({
    //                 success: false,
    //                 message: "Post not found",
    //             });
    //         }
    //         await mongo.Post.updateOne(
    //             { _id: new ObjectId(id) },
    //             { $addToSet: { likes: userId } }
    //         );
    //         return res.json({
    //             success: true,
    //             message: "Liked post successfully",
    //         });
    //     } catch (error) {
    //         console.error("Error occurred while liking post:", error);
    //         throw new Error("Error occurred while liking post from database");
    //     }
    // },
};


