import Joi from "joi";

const categorySchema = Joi.object({
    name: Joi.string().required(),
    content: Joi.string().optional(),
    slug: Joi.string().optional(),
});

export default categorySchema;