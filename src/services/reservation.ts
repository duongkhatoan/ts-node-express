import { Request, Response } from "express";
import validateNewReservation from "~/validators/reservation/newReservation";
import { handleSlug, tryParseJSON } from "~/helpers/utils";
import { orderByField as buildMysqlOrders } from "~/helpers/buildMongoOrder";
import buildMongoFilter from "~/helpers/buildMongoFilter";
import websocket from '~/libs/WebSocket'
import { PrismaClient } from "@prisma/client";




interface Context {
    user: {
        id: string,
    };
    client: any,
}
type RequestContext = Request & { context: Context };

export default {
    // GET: /api/reservations
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


            const reservations = await client.reservation.findMany({
                where: buildMongoFilter(parsedFilter, true),
                include: parsedIncludes || {
                    listing: true,
                },
                ...options,
            });





            return res.json({
                success: true,
                data: reservations,
            });
        } catch (error) {
            console.error(
                "Error occurred while fetching reservations from database:",
                error
            );
            return res.json({ success: false, message: "Error occurred while fetching reservations from database" });
            throw new Error("Error occurred while fetching reservations from database");
        }
    },
    // GET: /api/reservations/:id
    view: async (req: any, res: any) => {
        try {
            const { filter, includes, sort, limit, skip = 0 } = req.query
            const reservationId = req.params.id;
            const { context } = req;
            const { client } = context;
            const parsedIncludes = includes ? tryParseJSON(includes) : {}
            const response = await client.reservation.findFirst(
                {
                    where: { id: reservationId, deletedAt: { isSet: false } },
                    include: parsedIncludes

                }
            );

            console.log(parsedIncludes);
            return res.json({
                success: true,
                data: response,
            });
        } catch (error: any) {
            console.error(
                "Error occurred while fetching reservationId from database:",
                error.message
            );
            throw new Error("Error occurred while fetching reservationId from database");
        }
    },
    // POST: /api/reservations/create
    create: async (req: any, res: any) => {
        try {
            const { client } = req.context || {};
            const args = req.body;
            const { error, value } = validateNewReservation.validate(args);

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


            const result = await client.reservation.create({
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
            console.error("Error occurred while creating reservation:", error);
            return res.json({ success: false, message: "Error occurred while creating reservation" });
            // throw new Error("Error occurred while creating reservation");
        }
    },
    // PATCH: /api/posts/:id
    update: async (req: any, res: any) => {
        try {
            const { context } = req;
            const { client } = context;
            const { id } = req.params;
            const args = req.body;
            const { error, value } = validateNewReservation.validate(args);

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
    // DELETE: /api/reservations/:id
    delete: async (req: any, res: any) => {
        try {
            const { context, body } = req;
            const { client } = context;
            const { id } = req.params;

            const currentReservation = await client.reservation.findFirst(
                {
                    where: {
                        id,
                        deletedAt: { isSet: false }
                    }
                }
            )
            if (!currentReservation) {
                return res.status(404).json({
                    success: false,
                    message: "Reservation not found",
                });
            }
            await client.reservation.update({
                where: {
                    id
                },
                data: {
                    deletedAt: new Date()
                }
            })
            return res.json({
                success: true,
                message: "Deleted Reservation successfully",
            });
        } catch (error) {
            console.error("Error occurred while deleting Reservation:", error);
            return res.json({ success: false, message: "Error occurred while deleting Reservation" });
            throw new Error("Error occurred while deleting Reservation from database");
        }
    },
};
const validateRequest = async (
    args: any,
    client: PrismaClient
): Promise<{ success: boolean; message?: string }> => {
    const listing = await client.listing.findFirst({
        where: { id: args.listingId, deletedAt: { isSet: false } },
    });

    if (!listing) {
        return { success: false, message: 'Listing not found' };
    }

    return { success: true };
};


