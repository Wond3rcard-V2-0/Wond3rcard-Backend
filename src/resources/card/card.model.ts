import { model, Schema } from "mongoose";
import { Card, CardType } from "./card.protocol";

const cardSchema = new Schema<Card>(
  {
    cardType: { type: String, enum: Object.values(CardType), required: true },
    creatorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },

    cardStyle: {
      fontSize: { type: String, default: "16px" },
      fontStyle: {
        type: String,
        enum: ["normal", "italic", "oblique"],
        default: "normal",
      },
      fontWeight: {
        type: String,
        enum: ["normal", "bold", "bolder", "lighter"],
        default: "normal",
      },
      textAlign: {
        type: String,
        enum: ["left", "center", "right", "justify"],
        default: "left",
      },
      textColor: { type: String, default: "#000000" },
      borderStyle: {
        type: String,
        enum: ["none", "solid", "dashed", "dotted", "double"],
        default: "none",
      },
      borderColor: { type: String, default: "" },
      borderWidth: { type: String, default: "" },
      borderRadius: { type: String, default: "" },
      padding: { type: String, default: "10px" },
      margin: { type: String, default: "15px" },
      orientation: {
        type: String,
        enum: ["horizontal", "vertical"],
        default: "horizontal",
      },
      alignment: {
        type: String,
        enum: ["leading", "center", "trailing"],
        default: "leading",
      },
      boxShadow: { type: String, default: "" },
      primaryColor: { type: String, default: "" },
      secondaryColor: { type: String, default: "" },
    },

    organizationInfo: {
      organizationId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "Organization",
      },
      organizationName: { type: String, required: false },
    },

    contactInfo: {
      email: { type: String, default: "" },
      emailType: [{ type: String, default: [] }],
      phone: { type: String, default: "" },
      website: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    socialMediaLinks: [
      {
        socialMediaId: { type: Schema.Types.ObjectId, ref: "SocialMedia" },
        username: { type: String, default: "" },
        link: { type: String, default: "" },
        active: { type: Boolean, default: true },
        media: {
          iconUrl: { type: String },
          name: { type: String },
          type: { type: String },
          link: { type: String },
        },
      },
    ],
    cardName: { type: String, required: true },
    prefix: { type: String, default: "" },
    pronoun: { type: String, default: "" },
    firstName: { type: String, required: true },
    otherName: { type: String, default: "" },
    lastName: { type: String, required: true },
    designation: { type: String, default: "" },

    testimonials: [
      {
        name: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        designation: { type: String, required: true },
        company: { type: String, required: true },
        testimony: { type: String, required: true },
      },
    ],

    sharedWith: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        sharedAt: { type: Date, default: Date.now },
      },
    ],

    catelogue: [
      {
        imageUrl: { type: String, default: "" },
        title: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],

    videoUrl: { type: String, default: "" },
    cardPictureUrl: { type: String, default: "" },
    cardCoverUrl: { type: String, default: "" },
    active: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default model<Card>("Card", cardSchema);
