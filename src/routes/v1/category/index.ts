import express from 'express'
import CategoryServices from "../../../services/category"


const router = express.Router()

router.get("/", CategoryServices.list);

// View
router.get("/:id", CategoryServices.view);

// Create
router.post("/", CategoryServices.create);

// Update
router.patch("/:id", CategoryServices.update);

// Delete
router.delete("/:id", CategoryServices.delete);



export default router
// router.get("/me", AuthServices.me)