import Joi from "joi";

const validateSignUp = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  otherName: Joi.string().allow(""),
  email: Joi.string().email().required(),
  mobileNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in international format, e.g., +1234567890",
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:'\",<>,./?])"
      )
    )
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 128 characters.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    }),
  fcmToken: Joi.string().required(),
  companyName: Joi.string().allow(""),
  designation: Joi.string().allow(""),
});

const validateSignIn = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:'\",<>,./?])"
      )
    )
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 128 characters.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    }),
});

const validateVerifyMFA = Joi.object({
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
});

const validateVerifyAccount = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().min(6).required(),
});

const validateRequestVerifyAccount = Joi.object({
  email: Joi.string().email().required(),
});

const validateDeleteAccount = Joi.object({
  email: Joi.string().email().required(),
});

const validateOTPCode = Joi.object({
  code: Joi.string()
    .pattern(/^[a-zA-Z0-9]{6}$/)
    .required(),
  email: Joi.string().email().required(),
});

const validatePassword = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:'\",<>,./?])"
      )
    )
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 128 characters.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    }),
});

export const validateChangePasswordReset = Joi.object({
  email: Joi.string().email().required(),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:'\",<>,./?])"
      )
    )
    .required()
    .messages({
      "string.base": "New password must be a string.",
      "string.min": "New password must be at least 8 characters long.",
      "string.max": "New password must not exceed 128 characters.",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
      "any.required": "New password is required.",
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.base": "Confirm new password must be a string.",
      "any.required": "Confirm new password is required.",
      "string.valid": "Confirm new password must match the new password.",
    }),
});

const changeUserRole = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid("admin", "staff", "customer").required(),
});

const changeUserTier = Joi.object({
  userId: Joi.string().required(),
  tier: Joi.string().valid("basic", "premium", "business").required(),
});

const changeUserStatus = Joi.object({
  userId: Joi.string().required(),
  status: Joi.string().valid("active", "suspended", "banned").required(),
});

const validateChangePassword = Joi.object({
  oldPassword: Joi.string().min(8).max(128).required().messages({
    "string.base": "Old password must be a string.",
    "string.min": "Old password must be at least 8 characters long.",
    "string.max": "Old password must not exceed 128 characters.",
    "any.required": "Old password is required.",
  }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:'\",<>,./?])"
      )
    )
    .required()
    .messages({
      "string.base": "New password must be a string.",
      "string.min": "New password must be at least 8 characters long.",
      "string.max": "New password must not exceed 128 characters.",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
      "any.required": "New password is required.",
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.base": "Confirm new password must be a string.",
      "any.required": "Confirm new password is required.",
      "string.valid": "Confirm new password must match the new password.",
    }),
});
export default {
  validateSignIn,
  validateSignUp,
  validateVerifyMFA,
  validateVerifyAccount,
  validateRequestVerifyAccount,
  validateDeleteAccount,
  validateOTPCode,
  validatePassword,
  validateChangePassword,
  validateChangePasswordReset,
  changeUserRole,
  changeUserTier,
  changeUserStatus,
};
