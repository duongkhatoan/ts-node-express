import { Request, Response } from "express";
import validateNewCategory from "~/validators/category/newCategory";
import { generateSlug } from "../utils/slug";
interface Category {
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
        try {
            const { context } = req;
            const { client } = context || {};
            const categories = await client.category.findMany({
                where: {
                    name: {
                        contains: "es",
                        mode: "insensitive"
                    },
                    deletedAt: { isSet: false }
                }
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
            const categoryId = req.params.id;
            const { context } = req;
            const { client } = context;
            const response = await client.category.findFirst({ where: { id: categoryId, deletedAt: { isSet: false } } });
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
            const { error, value } = validateNewCategory.validate(args);

            console.log('req.context', req.context)
            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }
            if (!value.slug) {
                value.slug = await generateSlug(client.category, value.name as string);
            }
            else {
                const existSlug = await client.category.findFirst({
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

            const result = await client.category.create({
                data: {
                    ...value
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
            const { error, value } = validateNewCategory.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }

            const currentCategory = await client.category.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }

            if (value.slug) {
                const existSlug = await client.category.findFirst({
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

            await client.category.update(
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
                message: "Updated category successfully",
            });
        } catch (error) {
            console.error("Error occurred while updating category:", error);
            throw new Error("Error occurred while updating category");
        }
    },
    // DELETE: /api/categories/:id
    delete: async (req: any, res: any) => {
        try {
            const { context, body } = req;
            const { client } = context;
            const { id } = req.params;

            const currentCategory = await client.category.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentCategory) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }
            await client.category.update({
                where: {
                    id
                },
                data: {
                    deletedAt: new Date()
                }
            })
            return res.json({
                success: true,
                message: "Deleted category successfully",
            });
        } catch (error) {
            console.error("Error occurred while deleting category:", error);
            throw new Error("Error occurred while deleting category from database");
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
