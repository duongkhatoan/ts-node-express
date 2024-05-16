import express from 'express'
import ReservationServices from "../../../services/reservation"
import { requireLogin } from '~/middlewares/require-login';


const router = express.Router()

router.get("/", ReservationServices.list);

// View
router.get("/:id", ReservationServices.view);

// Create
router.post("/", requireLogin, ReservationServices.create);

// Update
router.patch("/:id", requireLogin, ReservationServices.update);

// Delete
router.delete("/:id", requireLogin, ReservationServices.delete);



export default router
// router.get("/me", AuthServices.me)