
import { requireLogin } from '~/middlewares/require-login';
import authRouter from './auth'
import categoryRouter from './category'
import postRouter from './post'
import listingRouter from './listing'
import reservationRouter from './reservation'
import userRouter from './user'
import { requireAdmin } from '~/middlewares/require-admin';

export default function routes(app: any) {
    app.use("/api/auth", authRouter);
    app.use("/api/categories", requireLogin, categoryRouter);
    app.use("/api/posts", requireLogin, postRouter);
    app.use("/api/listings", listingRouter);
    app.use("/api/reservations", requireLogin, reservationRouter);
    app.use("/api/users", requireAdmin, userRouter)
};
