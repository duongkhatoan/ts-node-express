import { Request, Response } from "express";
import validateNewPost from "~/validators/post/newPost";
import { handleSlug, tryParseJSON } from "~/helpers/utils";
import { orderByField as buildMysqlOrders } from "~/helpers/buildMongoOrder";
import buildMongoFilter from "~/helpers/buildMongoFilter";
import { PrismaClient } from "@prisma/client";
interface Post {
    id: string;
    name: string;
    content: string;
    slug: string;
    // Add more properties as needed
}

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
            console.log(parsedFilter);
            if (limit) {
                options.take = Number(limit)
            }

            if (parsedSort) {
                options.orderBy = buildMysqlOrders(parsedSort)
            }

            const { context } = req;
            const { client } = context || {};
            console.log(buildMongoFilter(parsedFilter, true));

            const categories = await client.post.findMany({
                where: buildMongoFilter(parsedFilter, true),
                include: parsedIncludes || {},
                ...options,
            });

            return res.json({
                success: true,
                data: categories,
            });
        } catch (error) {
            console.error(
                "Error occurred while fetching categories from database:",
                error
            );
            throw new Error("Error occurred while fetching categories from database");
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
            const { error, value } = validateNewPost.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }
            try {
                value.slug = await handleSlug(client, 'post', value, 'name');
            }
            catch (err: any) {
                return res.json({ success: false, message: err.message });
            }
            const validator = await validateRequest(value, client);

            if (!validator.success) {
                return res.json({
                    success: false,
                    errors: validator.message
                });
            }

            const result = await client.post.create({
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
            const { error, value } = validateNewPost.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }

            const validator = await validateRequest(value, client);

            if (!validator.success) {
                return res.json({
                    success: false,
                    errors: validator.message
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


const validateRequest = async (
    args: any,
    client: PrismaClient
): Promise<{ success: boolean; message?: string }> => {
    const category = await client.category.findFirst({
        where: { id: args.categoryId, deletedAt: { isSet: false } },
    });

    if (!category) {
        return { success: false, message: 'Category not found' };
    }

    return { success: true };
};