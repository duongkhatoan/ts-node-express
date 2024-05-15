import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import client from '../database';

interface User {
    _id?: ObjectId;
}

interface Context {
    client: any;
    // db: any;
    user?: any;
    language: string;
    serverUrl: string;
    origin: any;
}

type RequestCustom = Request & {
    context: Context;
    user: any,
};

export default function withContext({ client }: { client: any }) {
    return async (req: RequestCustom, res: Response, next: NextFunction) => {
        // console.log(123);
        const origin = req.get('origin');
        const user = req.user || {};
        const userId = user.id as string;
        
        let authorizedUser

        if (userId) {
            authorizedUser = await client.user.findFirst({
                where: {
                    id: userId,
                    deletedAt: { isSet: false }
                },
            })
        }

        const context: Context = {
            client,
            user: authorizedUser ? { id: authorizedUser.id } : null,
            language: req.headers['x-language'] as string || '',
            serverUrl: `${req.protocol}://${req.get('host')}`,
            origin,
        };

        // console.log(context);

        req.context = context;
        next();
    };
}
