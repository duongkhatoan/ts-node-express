import Joi from "joi";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const postSchema = Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().optional(),
    summary: Joi.string().optional().allow(''),
    content: Joi.string().optional().allow(''),
    categoryId: Joi.string()
        .regex(objectIdRegex)
        .required(),
    imageUrl: Joi.string().optional().allow(''),
});

export default postSchema;