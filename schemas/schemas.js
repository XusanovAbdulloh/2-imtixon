import Joi from "joi";

export const userRegisterSchema = Joi.object({
    firstName: Joi.string().min(1).required(),
    lastName: Joi.string().min(1).required(),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    password: Joi.string().min(6).required()
})
export const userLoginSchema = Joi.object({
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    password: Joi.string().min(6).required()
})
export const userEditSchema = Joi.object({
    firstName: Joi.string().min(1),
    lastName: Joi.string().min(1),
    email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().min(6)
})
export const bookPostEditSchema = Joi.object({
    title: Joi.string().min(1).required(),
    authorId: Joi.number().min(1).required(),
    category: Joi.string().min(2).required()
})
export const authorSchema = Joi.object({
    id: Joi.number().min(1).required(),
    name: Joi.string().min(3).required()
})

