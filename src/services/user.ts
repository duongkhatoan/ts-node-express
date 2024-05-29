import validateNewUser from '~/validators/user/newUser';
import { Request } from "express";
import { tryParseJSON } from "~/helpers/utils";
import { orderByField as buildMysqlOrders } from "~/helpers/buildMongoOrder";
import buildMongoFilter from "~/helpers/buildMongoFilter";
import websocket from '~/libs/WebSocket'
import validateUpdateUser from "~/validators/user/updateUser"


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
    // GET: /api/users
    list: async (req: any, res: any) => {
        const { filter, includes, sort, limit, skip = 0 } = req.query

        try {
            const parsedFilter: IListingParams = tryParseJSON(filter)

            const parsedSort = sort


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

            const users = await client.user.findMany({
                where: buildMongoFilter(parsedFilter, true),
                include: parsedIncludes,
                ...options,
            });

            const userCount = await client.user.count({
                where: buildMongoFilter(parsedFilter, true),
            });

            return res.json({
                success: true,
                data: users,
                count: userCount,
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
    // GET: /api/users/:id
    view: async (req: any, res: any) => {

        try {
            const { filter, includes, sort, limit, skip = 0 } = req.query
            const itemId = req.params.id;

            const { context } = req;
            const { client } = context;
            const parsedIncludes = includes ? tryParseJSON(includes) : {}

            const response = await client.user.findFirst(
                {
                    where: { id: itemId, deletedAt: { isSet: false } },
                    include: parsedIncludes
                }
            );
            return res.json({
                success: true,
                data: response,
            });
        } catch (error: any) {
            return res.json({ success: false, message: "Error occurred while fetching user" });
            throw new Error("Error occurred while fetching listingId from database");
        }
    },
    // POST: /api/users/create
    create: async (req: any, res: any) => {
        try {
            const { client } = req.context || {};
            const args = req.body;
            const { error, value } = validateNewUser.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }

            const result = await client.user.create({
                data: {
                    ...value,
                }
            })
            // websocket.broadcastChange("users", "create", result)
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
            const { error, value } = validateUpdateUser.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }

            const currentItem = await client.user.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentItem) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            await client.user.update(
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
                message: "Updated User successfully",
            });
        } catch (error) {
            console.error("Error occurred while updating User:", error);
            return res.json({ success: false, message: "Error occurred while updating User" });
            throw new Error("Error occurred while updating post");
        }
    },
    // DELETE: /api/categories/:id
    delete: async (req: any, res: any) => {
        try {
            const { context, body } = req;
            const { client } = context;
            const { id } = req.params;

            const currentUser = await client.user.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (currentUser.role !== 0) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to delete this user",
                });
            }
            await client.user.update({
                where: {
                    id
                },
                data: {
                    deletedAt: new Date()
                }
            })
            return res.json({
                success: true,
                message: "Deleted User successfully",
            });
        } catch (error) {
            console.error("Error occurred while deleting user:", error);
            return res.json({ success: false, message: "Error occurred while deleting user" });
            throw new Error("Error occurred while deleting post from database");
        }
    },
    // delete multiple
    deleteMultiple: async (req: any, res: any) => {
        try {
            const { context } = req;
            const { client } = context;
            const { ids } = req.body;
            const response = await client.user.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            })
            return res.json({
                success: true,
                message: "Deleted User successfully",
            });
        } catch (error) {
            console.error("Error occurred while deleting user:", error);
            return res.json({ success: false, message: "Error occurred while deleting user" });
            throw new Error("Error occurred while deleting user from database");
        }
    }
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


