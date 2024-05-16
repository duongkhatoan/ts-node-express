import Joi from "joi";

const reservationSchema = Joi.object({
    listingId: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    totalPrice: Joi.number().integer().required(),
});

export default reservationSchema