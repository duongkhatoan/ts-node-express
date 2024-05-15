import express from 'express'
import ListingServices from "../../../services/listing"
import { requireLogin } from '~/middlewares/require-login';


const router = express.Router()

router.get("/", ListingServices.list);

// View
router.get("/:id", ListingServices.view);

// Create
router.post("/", requireLogin, ListingServices.create);

// Update
router.patch("/:id", requireLogin, ListingServices.update);

// Delete
router.delete("/:id", requireLogin, ListingServices.delete);



export default router
// router.get("/me", AuthServices.me)