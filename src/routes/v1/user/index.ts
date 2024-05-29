import express from 'express'
import UserServices from "../../../services/user"



const router = express.Router()
router.get("/", UserServices.list);
router.get("/:id", UserServices.view);
router.post("/", UserServices.create);
router.patch("/:id", UserServices.update);
router.delete("/:id", UserServices.delete);

// delete multiple
router.delete("/", UserServices.deleteMultiple);




export default router
// router.get("/me", AuthServices.me)