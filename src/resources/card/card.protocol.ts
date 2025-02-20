import { Document, Types } from "mongoose";

export enum CardType {
  Personal = "personal",
  Business = "business",
  Organizational = "organizational",
}

interface CardTestimony {
  _id?: Types.ObjectId;
  name: string;
  userId: string;
  designation: string;
  company: string;
  testimony: string;
}

interface CardCatelog {
  _id?: Types.ObjectId;
  imageUrl?: string;
  title?: string;
  description?: string;
}

interface CardStyle {
  fontSize?: string;
  fontStyle?: "normal" | "italic" | "oblique";
  fontWeight?: "normal" | "bold" | "bolder" | "lighter" | number;
  textAlign?: "left" | "center" | "right" | "justify";
  textColor?: string;
  borderStyle?: "none" | "solid" | "dashed" | "dotted" | "double";
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  orientation?: "horizontal" | "vertical";
  alignment: "leading" | "center" | "trailing";
  boxShadow?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface AddressInfo {
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  city: string;
  label: string;
  street: string;
}

interface CardContactInfo {
  email?: string;
  emailType?: string[];
  phone?: string;
  website?: string;
  addresses: AddressInfo[];
}

interface CardOrganizationInfo {
  organizationId: Types.ObjectId;
  organizationName: string;
}

interface SocialMediaLink {
  iconUrl: string;
  name: string;
  type: string;
  link: string;
}

interface CardSocialMediaLink {
  media: SocialMediaLink;
  username: string;
  active: boolean;
}

export interface Card extends Document {
  cardType: CardType;
  creatorId: Types.ObjectId;
  ownerId: Types.ObjectId;
  cardStyle: CardStyle;
  organizationInfo: CardOrganizationInfo;
  contactInfo: CardContactInfo;
  socialMediaLinks: CardSocialMediaLink[];
  addressInfo: AddressInfo;
  cardName: string;
  prefix?: string;
  pronoun?: string;
  firstName: string;
  otherName: string;
  lastName: string;
  designation: string;
  testimonials: CardTestimony[];
  catelogue: CardCatelog[];
  videoUrl: string;
  cardPictureUrl: string;
  cardCoverUrl: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export {
  AddressInfo,
  CardCatelog,
  CardContactInfo,
  CardSocialMediaLink,
  CardStyle,
  CardTestimony,
  SocialMediaLink,
};
