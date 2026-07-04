// import Joi from 'joi';

// export const registerSubscriptionSchema = Joi.object({
//   recipient: Joi.object({
//     id: Joi.string().required().messages({
//       'any.required': 'Recipient ID is required',
//       'string.empty': 'Recipient ID cannot be empty'
//     }),
//     model: Joi.string().valid('User', 'Student', 'Parent').required().messages({
//       'any.required': 'Recipient model is required',
//       'any.only': 'Recipient model must be one of User, Student, Parent'
//     })
//   }).required(),
//   subscription: Joi.object({
//     endpoint: Joi.string().uri().required().messages({
//       'any.required': 'Subscription endpoint is required',
//       'string.uri': 'Subscription endpoint must be a valid URI'
//     }),
//     keys: Joi.object({
//       p256dh: Joi.string().required().messages({
//         'any.required': 'p256dh key is required'
//       }),
//       auth: Joi.string().required().messages({
//         'any.required': 'auth key is required'
//       })
//     }).required()
//   }).required()
// });
