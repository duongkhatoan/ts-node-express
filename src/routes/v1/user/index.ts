import express from 'express'
import UserServices from "../../../services/user"
import { requireLogin } from '~/middlewares/require-login';


const router = express.Router()
router.get("/", UserServices.list);
router.get("/:id", UserServices.view);
router.post("/:id", UserServices.update);



export default router
// router.get("/me", AuthServices.me)