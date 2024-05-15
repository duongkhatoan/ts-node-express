import express from 'express'
import AuthServices from "../../../services/auth"
import { requireLogin } from '~/middlewares/require-login';


const router = express.Router()
router.post("/login", AuthServices.login);
router.post("/signup", AuthServices.register)
router.get("/me", AuthServices.me)
router.post("/addFavorite", requireLogin, AuthServices.addFavorites)



export default router
// router.get("/me", AuthServices.me)