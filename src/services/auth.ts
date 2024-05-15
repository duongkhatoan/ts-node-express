import _ from "lodash";
import { tryLogin, tryRegister } from "~/utils/auth";
import validateNewUser from "~/validators/user/newUser";

export default {
    login: async (req: any, res: any, next: any) => {
        try {
            const { context } = req;
            const args = req.body;
            const { client } = context;

            if ("username" in args) {
                args.username = args.username.toLowerCase().trim();
            }
            const result = await tryLogin(
                {
                    username: args.username,
                    password: args.password,
                    remember: args.remember,
                },
                { client }
            );

            res
                .json({
                    ...result,
                    // user: await resolver(result.user, context, { type: 'User', info }),
                })
                .status(result.success ? 200 : 422);
        } catch (error) {
            console.log(error)
        }
    },

    register: async (req: any, res: any, next: any) => {
        try {
            const { context } = req;
            const args = req.body;
            const { client } = context;
            const { error, value } = validateNewUser.validate(args);

            if (error) {
                return res.json({
                    success: false,
                    errors: error.details,
                });
            }


            const result = await tryRegister(
                value,
                { client }
            );
            res
                .json({
                    ...result,
                    // user: await resolver(result.user, context, { type: 'User', info }),
                })
                .status(result.success ? 200 : 422);
        } catch (error) {
            console.log(error)
        }
    },
    me: async (req: any, res: any, next: any) => {
        const { context } = req
        const { client, user } = context

        if (!user || _.isEmpty(user)) return res.json({ me: null })
        const currentUser = await client.user.findFirst({
            where: {
                id: user.id,
                deletedAt: { isSet: false }
            }
        })

        res.json({ me: currentUser })
    },
    addFavorites: async (req: any, res: any, next: any) => {
        const { context } = req
        const { client, user } = context



        if (!user || _.isEmpty(user)) return res.json({ me: null })

        const currentUser = await client.user.findFirst({
            where: {
                id: user.id,
                deletedAt: { isSet: false }
            }
        })
        const { listingId } = req.body
        let mode = "Add"

        if (currentUser.favoriteIds.includes(listingId)) {
            mode = "Remove"
            currentUser.favoriteIds = currentUser.favoriteIds.filter((id: string) => id !== listingId)
        }
        else {
            currentUser.favoriteIds.push(listingId)
        }

        await client.user.update({
            where: {
                id: user.id
            },
            data: {
                favoriteIds: currentUser.favoriteIds
            }
        })
        res.json({ success: true, message: `${mode} favorite success` })
    }
}