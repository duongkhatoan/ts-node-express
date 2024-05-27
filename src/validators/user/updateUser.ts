import Joi from "joi";

export default Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(30).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    password: Joi.string().optional(),
    avatarUrl: Joi.string().uri().optional(),
});

