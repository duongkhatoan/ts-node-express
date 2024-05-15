import { Request, Response } from "express";
import validateNewListing from "~/validators/listing/newListing";
import { handleSlug, tryParseJSON } from "~/helpers/utils";
import { orderByField as buildMysqlOrders } from "~/helpers/buildMongoOrder";
import buildMongoFilter from "~/helpers/buildMongoFilter";



interface Context {
    user: {
        id: string,
    };
    client: any,
}
type RequestContext = Request & { context: Context };

export default {
    // GET: /api/categories
    list: async (req: any, res: any) => {
        const { filter, includes, sort, limit, skip = 0 } = req.query
        try {
            const parsedFilter = tryParseJSON(filter)
            const parsedSort = tryParseJSON(sort)
            const parsedIncludes = tryParseJSON(includes)
            const options: { take?: number, orderBy?: any, skip: number } = {
                skip: Number(skip),

            }

            if (limit) {
                options.take = Number(limit)
            }

            if (parsedSort) {
                options.orderBy = buildMysqlOrders(parsedSort)
            }

            const { context } = req;
            const { client } = context || {};


            const listings = await client.listing.findMany({
                where: buildMongoFilter(parsedFilter, true),
                include: parsedIncludes || {},
                ...options,
            });

            // console.log(listings);

            return res.json({
                success: true,
                data: listings,
            });
        } catch (error) {
            console.error(
                "Error occurred while fetching listings from database:",
                error
            );
            throw new Error("Error occurred while fetching listings from database");
        }
    },
    // GET: /api/categories/:id
    view: async (req: any, res: any) => {
        try {
            const postId = req.params.id;
            const { context } = req;
            const { client } = context;
            const response = await client.post.findFirst(
                {
                    where: { id: postId, deletedAt: { isSet: false } },
                    include: {
                        category: {
                            select: { name: true }
                        }
                    }
                }
            );
            return res.json({
                success: true,
                data: response,
            });
        } catch (error: any) {
            console.error(
                "Error occurred while fetching categories from database:",
                error.message
            );
            throw new Error("Error occurred while fetching categories from database");
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

            if (value.slug) {
                const existSlug = await client.post.findFirst({
                    where: {
                        slug: value.slug
                    }
                })

                if (existSlug) {
                    return res.json({
                        success: false,
                        message: "Slug already exists"
                    })
                }
            }

            await client.post.update(
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
                message: "Updated post successfully",
            });
        } catch (error) {
            console.error("Error occurred while updating post:", error);
            throw new Error("Error occurred while updating post");
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


