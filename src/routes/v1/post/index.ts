import express from 'express'
import PostServices from "../../../services/post"


const router = express.Router()

router.get("/", PostServices.list);

// View
router.get("/:id", PostServices.view);

// Create
router.post("/", PostServices.create);

// Update
router.patch("/:id", PostServices.update);

// Delete
router.delete("/:id", PostServices.delete);



export default router
// router.get("/me", AuthServices.me)