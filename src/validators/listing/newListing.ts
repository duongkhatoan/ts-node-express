import Joi from 'joi';

const listingSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    imageSrc: Joi.string().required(),
    category: Joi.string().required(),
    roomCount: Joi.number().integer().min(0).required(),
    bathroomCount: Joi.number().integer().min(0).required(),
    guestCount: Joi.number().integer().min(0).required(),
    price: Joi.number().integer().min(0).required(),
    country: Joi.string().optional(),
    latlng: Joi.array().items(Joi.number()).length(2).required(),
    region: Joi.string().optional(),
})

export default listingSchema