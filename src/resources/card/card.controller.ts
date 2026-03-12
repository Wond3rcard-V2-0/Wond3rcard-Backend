import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import { canCreateCardMiddleware } from "../../middlewares/card.middlewares";
import validationMiddleware from "../../middlewares/validation.middleware";
import GlobalController from "../../protocols/global.controller";
import { uploadCatelogueMiddleware } from "../../middlewares/uploaders/uploadCatalogueImages";
import { uploadCardMediaMiddleware } from "../../middlewares/uploaders/uploadCardMedia";
import {
  AddressInfo,
  CardCatelog,
  CardContactInfo,
  CardSocialMediaLink,
  CardStyle,
  CardTestimony,
  SocialMediaLink,
} from "./card.protocol";
import CardService from "./card.service";
import validator from "./card.validator";

class CardController implements GlobalController {
  public path = "/cards";
  public router = Router();
  private cardService = new CardService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/cards:
     *   get:
     *     tags: [cards]
     *     summary: Retrieve authenticated user's cards
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cards retrieved
     */
    this.router.get(
      `${this.path}`,
      authenticatedMiddleware,
      this.retrieveUserCards
    );

    /**
     * @openapi
     * /api/cards/create:
     *   put:
     *     tags: [cards]
     *     summary: Create a digital card for the authenticated user
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               cardPhoto:
     *                 type: string
     *                 format: binary
     *               cardCoverPhoto:
     *                 type: string
     *                 format: binary
     *               cardVideo:
     *                 type: string
     *                 format: binary
     *               cardName:
     *                 type: string
     *                 example: "My Business Card"
     *               firstName:
     *                 type: string
     *                 example: "John"
     *               lastName:
     *                 type: string
     *                 example: "Doe"
     *               socialMediaLinks:
     *                 type: string
     *                 description: >
     *                   Array of social media IDs supplied as a JSON array or a comma-separated list.
     *                 example: |
     *                   ["507f1f77bcf86cd799439011","507f1f77bcf86cd799439012"]
     *                   507f1f77bcf86cd799439011,507f1f77bcf86cd799439012
     *               style:
     *                 type: object
     *               contactInfo:
     *                 type: object
     *     responses:
     *       201:
     *         description: Card created
     */
    this.router.put(
      `${this.path}/create`,
      [
        authenticatedMiddleware,
        uploadCardMediaMiddleware,
        canCreateCardMiddleware,
      ],
      this.createCard
    );

    /**
     * @openapi
     * /api/cards/create-team:
     *   put:
     *     tags: [cards]
     *     summary: Create a card for an organization team member
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               ownerId:
     *                 type: string
     *               organizationInfo:
     *                 type: object
     *     responses:
     *       201:
     *         description: Team member card created
     */
    this.router.put(
      `${this.path}/create-team`,
      [
        authenticatedMiddleware,
        canCreateCardMiddleware,
        validationMiddleware(validator.validateCreateTeamMemberCard),
      ],
      this.createTeamMemberCard
    );

    /**
     * @openapi
     * /api/cards/get-card/{cardId}:
     *   get:
     *     tags: [cards]
     *     summary: Retrieve a card by id
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card details
     */
    this.router.get(`${this.path}/get-card/:cardId`, this.getCardById); // we can use an authentication token for guests for this later

    /**
     * @openapi
     * /api/cards/delete-all-cards:
     *   delete:
     *     tags: [cards]
     *     summary: Delete all cards belonging to the authenticated user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Cards deleted
     */
    this.router.delete(
      `${this.path}/delete-all-cards`,
      [authenticatedMiddleware],
      this.deleteAllUserCards
    );

    /**
     * @openapi
     * /api/cards/update-card/{cardId}:
     *   patch:
     *     tags: [cards]
     *     summary: Update a card
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               socialMediaLinks:
     *                 type: string
     *                 description: >
     *                   Array of social media IDs supplied as a JSON array or a comma-separated list.
     *                 example: |
     *                   ["507f1f77bcf86cd799439011","507f1f77bcf86cd799439012"]
     *                   507f1f77bcf86cd799439011,507f1f77bcf86cd799439012
     *     responses:
     *       200:
     *         description: Card updated
     */
    this.router.patch(
      `${this.path}/update-card/:cardId`,
      [authenticatedMiddleware, uploadCardMediaMiddleware],
      this.updateCard
    );

    /**
     * @openapi
     * /api/cards/update-org-card:
     *   patch:
     *     tags: [cards]
     *     summary: Update organization card
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Organization card updated
     */
    this.router.patch(
      `${this.path}/update-org-card`,
      [authenticatedMiddleware, validationMiddleware(validator.updateCard)],
      this.updateOrgCard
    );

    /**
     * @openapi
     * /api/cards/update-user-org-card:
     *   patch:
     *     tags: [cards]
     *     summary: Update a user's organization card
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: User organization card updated
     */
    this.router.patch(
      `${this.path}/update-user-org-card`,
      [authenticatedMiddleware, validationMiddleware(validator.updateCard)],
      this.updateUserOrgCard
    );

    /**
     * @openapi
     * /api/cards/delete-card/{cardId}:
     *   delete:
     *     tags: [cards]
     *     summary: Delete a specific card
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card deleted
     */
    this.router.delete(
      `${this.path}/delete-card/:cardId`,
      [authenticatedMiddleware],
      this.deleteCard
    );

    /**
     * @openapi
     * /api/cards/delete-user-org-card:
     *   delete:
     *     tags: [cards]
     *     summary: Delete a user's organization card connection
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/DeleteUserOrgCard'
     *     responses:
     *       200:
     *         description: User organization card deleted
     */
    this.router.delete(
      `${this.path}/delete-user-org-card/`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.deleteUserOrgCard),
      ],
      this.deleteUserOrgCard
    );

    /**
     * @openapi
     * /api/cards/toggle-card-status/{cardId}:
     *   patch:
     *     tags: [cards]
     *     summary: Toggle card activation status
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card status toggled
     */
    this.router.patch(
      `${this.path}/toggle-card-status/:cardId`,
      [authenticatedMiddleware],
      this.toggleCardStatus
    );

    /**
     * @openapi
     * /api/cards/add-social-media:
     *   put:
     *     tags: [cards]
     *     summary: Add social media link to card
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CardSocialMediaLink'
     *     responses:
     *       200:
     *         description: Social media link added
     */
    this.router.put(
      `${this.path}/add-social-media`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.socialMediaLinkSchema),
      ],
      this.addSocialMediaLink
    );

    /**
     * @openapi
     * /api/cards/update-social-media:
     *   patch:
     *     tags: [cards]
     *     summary: Update social media link
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Social media updated
     */
    this.router.patch(
      `${this.path}/update-social-media`,
      [authenticatedMiddleware],
      this.updateSocialMediaLink
    );

    /**
     * @openapi
     * /api/cards/delete-social-media:
     *   delete:
     *     tags: [cards]
     *     summary: Delete social media link
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Social media deleted
     */
    this.router.delete(
      `${this.path}/delete-social-media`,
      [authenticatedMiddleware],
      this.deleteSocialMediaLink
    );

    /**
     * @openapi
     * /api/cards/toggle-social-media:
     *   patch:
     *     tags: [cards]
     *     summary: Toggle visibility of social media link
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Social media visibility toggled
     */
    this.router.patch(
      `${this.path}/toggle-social-media`,
      [authenticatedMiddleware],
      this.toggleSocialMediaStatus
    );

    /**
     * @openapi
     * /api/cards/add-testimony:
     *   put:
     *     tags: [cards]
     *     summary: Add testimony to card
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Testimony added
     */
    this.router.put(
      `${this.path}/add-testimony`,
      [authenticatedMiddleware],
      this.addTestimony
    );

    /**
     * @openapi
     * /api/cards/delete-testimony:
     *   delete:
     *     tags: [cards]
     *     summary: Delete a testimony from card
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Testimony deleted
     */
    this.router.delete(
      `${this.path}/delete-testimony`,
      [authenticatedMiddleware],
      this.deleteTestimony
    );
    /**
     * @openapi
     * /api/cards/add-catelogue:
     *   put:
     *     tags: [cards]
     *     summary: Add catalogue items
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Catalogue items added
     */
    this.router.put(
      `${this.path}/add-catelogue`,
      [authenticatedMiddleware, uploadCatelogueMiddleware],
      this.addcatelogue
    );

    /**
     * @openapi
     * /api/cards/update-catelogue:
     *   patch:
     *     tags: [cards]
     *     summary: Update catalogue details
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Catalogue updated
     */
    this.router.patch(
      `${this.path}/update-catelogue`,
      [authenticatedMiddleware],
      this.updateCatelogue
    );

    /**
     * @openapi
     * /api/cards/delete-catelogue:
     *   delete:
     *     tags: [cards]
     *     summary: Delete catalogue entries
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Catalogue deleted
     */
    this.router.delete(
      `${this.path}/delete-catelogue`,
      [authenticatedMiddleware],
      this.deleteCatelogue
    );

    /**
     * @openapi
     * /api/cards/connection-request:
     *   get:
     *     tags: [cards]
     *     summary: Get pending connection requests
     *     responses:
     *       200:
     *         description: Connection requests returned
     */
    this.router.get(`${this.path}/connection-request`, this.connectionRequest);

    /**
     * @openapi
     * /api/cards/accept-connection-request:
     *   get:
     *     tags: [cards]
     *     summary: Accept a connection request via tokenized link
     *     responses:
     *       200:
     *         description: Connection accepted
     */
    this.router.get(
      `${this.path}/accept-connection-request`,
      this.acceptConnectionRequest
    );

    /**
     * @openapi
     * /api/cards/share/{cardId}:
     *   post:
     *     tags: [cards]
     *     summary: Share card via email/SMS
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ShareCardRequest'
     *     responses:
     *       200:
     *         description: Card shared
     */
    this.router.post(
      `${this.path}/share/:cardId`,
      [
        authenticatedMiddleware,
        validationMiddleware(validator.validateShareCard),
      ],
      this.shareCard
    );

    /**
     * @openapi
     * /api/cards/qr/{cardId}:
     *   post:
     *     tags: [cards]
     *     summary: Generate QR link for card
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: QR link generated
     */
    this.router.post(
      `${this.path}/qr/:cardId`,
      authenticatedMiddleware,
      this.generateQrShareLink
    );

    /**
     * @openapi
     * /api/cards/view-card/{cardId}:
     *   get:
     *     tags: [cards]
     *     summary: View public card profile
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Card view returned
     */
    /**
     * @openapi
     * /api/cards/vcf/{cardId}:
     *   get:
     *     tags: [cards]
     *     summary: Generate VCF download link for QR code or NFC tag
     *     description: Generates a download URL for VCF (vCard) file that can be used in QR codes or NFC tags for instant contact sharing
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *           example: '507f1f77bcf86cd799439011'
     *         description: MongoDB ObjectId of the card
     *     responses:
     *       200:
     *         description: VCF link generated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "VCF link generated successfully"
     *                 payload:
     *                   type: object
     *                   properties:
     *                     vcfDownloadLink:
     *                       type: string
     *                       example: 'https://api.wond3rcard.com/api/cards/download-vcf/507f1f77bcf86cd799439011'
     *                       description: URL to download the VCF file (use this for QR codes and NFC tags)
     *       404:
     *         description: Card not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 404
     *                 status:
     *                   type: string
     *                   example: "not_found"
     *                 message:
     *                   type: string
     *                   example: "Card not found"
     *       400:
     *         description: Invalid card ID
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 400
     *                 status:
     *                   type: string
     *                   example: "missing"
     *                 message:
     *                   type: string
     *                   example: "Please provide card ID"
     */
    this.router.get(`${this.path}/vcf/:cardId`, this.generateVCFLink);

    /**
     * @openapi
     * /api/cards/download-vcf/{cardId}:
     *   get:
     *     tags: [cards]
     *     summary: Download card as VCF (vCard) file
     *     parameters:
     *       - in: path
     *         name: cardId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: VCF file downloaded
     *         content:
     *           text/vcard:
     *             schema:
     *               type: string
     *       404:
     *         description: Card not found
     */
    this.router.get(`${this.path}/download-vcf/:cardId`, this.downloadVCF);
    this.router.get(`${this.path}/view-card/:cardId`, this.viewCard);
  }

  private createCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;

      const cardPhoto = req.files?.["cardPhoto"]?.[0];
      const cardCoverPhoto = req.files?.["cardCoverPhoto"]?.[0];
      const cardVideo = req.files?.["cardVideo"]?.[0];

      const style: CardStyle = {
        fontSize: req.body.fontSize || "18px",
        fontStyle: req.body.fontStyle || "normal",
        fontWeight: req.body.fontWeight || "normal",
        textAlign: req.body.textAlign || "left",
        textColor: req.body.textColor || "#000000",
        borderStyle: req.body.borderStyle || "none",
        borderColor: req.body.borderColor || "#000000",
        borderWidth: req.body.borderWidth || "0px",
        borderRadius: req.body.borderRadius || "0px",
        padding: req.body.padding || "10px",
        margin: req.body.margin || "15px",
        orientation: req.body.orientation || "horizontal",
        alignment: req.body.alignment || "leading",
        boxShadow: req.body.boxShadow || "none",
        primaryColor: req.body.primaryColor || "#FFFFFF",
        secondaryColor: req.body.secondaryColor || "#000000",
      };

      let cardAddresses: AddressInfo[] = [];
      if (req.body.addresses) {
        try {
          const parsedLinks = JSON.parse(req.body.addresses.toString());

          cardAddresses = parsedLinks.map((address: any) => ({
            latitude: address.latitude,
            longitude: address.longitude,
            country: address.country,
            state: address.state,
            city: address.city,
            label: address.label,
            street: address.street,
          }));
        } catch (error) {
          throw new HttpException(
            422,
            "invalid",
            `'Invalid social media links format'`
          );
        }
      }

      const contactInfo: CardContactInfo = {
        email: req.body.email,
        emailType: req.body.emailType,
        phone: req.body.phone,
        website: req.body.website,
        addresses: cardAddresses || [],
      };

      const card = await this.cardService.createCard(
        user,
        req.body,
        style,
        contactInfo,
        cardPhoto,
        cardCoverPhoto,
        cardVideo
      );
      res
        .status(201)
        .json({ message: "card created successfully", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private createTeamMemberCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const creator = req.user;
      const { ownerId, organizationInfo } = req.body;
      const { organizationId } = organizationInfo;
      const card = await this.cardService.createCardForOrganizationMember(
        creator,
        ownerId,
        req.body
      );
      res
        .status(201)
        .json({ message: "Card created successfully", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private retrieveUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const uid = req.user.id;
      const cards = await this.cardService.getAllUserCards(uid);
      if (cards.length === 0) {
        res.status(404).json({
          statusCode: 404,
          status: "failed",
          message: "You don't have any cards",
        });
      }
      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Cards retrieved successfully",
        payload: { cards },
      });
    } catch (error) {
      next(error);
    }
  };

  private getCardById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      const cardPhoto = req.files?.["cardPhoto"]?.[0];
      const cardCoverPhoto = req.files?.["cardCoverPhoto"]?.[0];
      const cardVideo = req.files?.["cardVideo"]?.[0];

      if (!cardId) {
        throw new HttpException(400, "missing", "Card ID is required");
      }

      // Handle contact info
      const contactInfo: CardContactInfo = {
        email: req.body.email || req.body["contactInfo[email]"],
        phone: req.body.phone || req.body["contactInfo[phone]"],
        website: req.body.website || req.body["contactInfo[website]"],
        emailType:
          req.body.emailType || req.body["contactInfo[emailType]"] || [],
        addresses: [],
      };

      // Handle addresses if provided
      if (req.body.addresses) {
        try {
          contactInfo.addresses = JSON.parse(req.body.addresses.toString());
        } catch (error) {
          throw new HttpException(422, "invalid", "Invalid addresses format");
        }
      }

      // Handle card style
      const cardStyle: CardStyle = {
        fontSize: req.body.fontSize || "18px",
        fontStyle: req.body.fontStyle || "normal",
        fontWeight: req.body.fontWeight || "normal",
        textAlign: req.body.textAlign || "left",
        textColor: req.body.textColor || "#000000",
        borderStyle: req.body.borderStyle || "none",
        borderColor: req.body.borderColor || "#000000",
        borderWidth: req.body.borderWidth || "0px",
        borderRadius: req.body.borderRadius || "0px",
        padding: req.body.padding || "10px",
        margin: req.body.margin || "15px",
        orientation: req.body.orientation || "horizontal",
        alignment: req.body.alignment || "leading",
        boxShadow: req.body.boxShadow || "none",
        primaryColor: req.body.primaryColor || "#FFFFFF",
        secondaryColor: req.body.secondaryColor || "#000000",
      };

      const data = {
        ...req.body,
        contactInfo,
        cardStyle,
        cardPictureUrl: cardPhoto?.path,
        cardCoverUrl: cardCoverPhoto?.path,
        videoUrl: cardVideo?.path,
      };

      const card = await this.cardService.updateCard(cardId, data);

      if (!card) {
        throw new HttpException(404, "not found", "Card not found");
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Card updated successfully",
        payload: { card },
      });
    } catch (error) {
      next(error);
    }
  };

  private updateOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.body;
      const user = req.user;
      const card = await this.cardService.updateOrgCard(user, cardId, req.body);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private updateUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      const { cardId } = req.body;
      const card = await this.cardService.updateUserOrganizationalCard(
        user,
        cardId,
        req.body
      );

      res.json(card);
    } catch (error) {
      next(error);
    }
  };

  private deleteCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.deleteCard(cardId, uid);
      res.status(200).json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteUserOrgCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, organizationId } = req.body;
      const user = req.user;
      const card = await this.cardService.deleteUserOrganizationCard(
        user,
        cardId,
        organizationId
      );
      res.status(200).json({ message: "Card deleted", payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteAllUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ownerId = req.user.id;
      const response = await this.cardService.deleteAllUserCards(ownerId);
      res
        .status(204)
        .json({ message: "All Cards deleted", payload: { response } });
    } catch (error) {
      next(error);
    }
  };

  private toggleCardStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      const uid = req.user.id;
      const card = await this.cardService.toggleCardStatus(cardId, uid);
      res.status(200).json({
        message: `Card ${card.active ? `activated` : `deactivated`}`,
        payload: { card },
      });
    } catch (error) {
      next(error);
    }
  };
  private addSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, socialMediaId, username, link } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.addSocialMediaLink(
        cardId,
        uid,
        socialMediaId,
        username,
        link
      );
      res
        .status(200)
        .json({ message: ` social media added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private updateSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, socialMediaId, username, link, active } = req.body;

      const updatedLinkData: Partial<CardSocialMediaLink> = {
        username,
        link,
        active,
      };
      const uid = req.user.id;
      const card = await this.cardService.updateSocialMediaLink(
        cardId,
        uid,
        socialMediaId,
        updatedLinkData
      );
      res
        .status(200)
        .json({ message: `Social media updated`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteSocialMediaLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, link } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.deleteSocialMediaLink(
        cardId,
        uid,
        link
      );
      res
        .status(200)
        .json({ message: `Social media deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private toggleSocialMediaStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, name } = req.body;
      const uid = req.user.id;
      const card = await this.cardService.toggleSocialMediaStatus(
        cardId,
        uid,
        name
      );
      res
        .status(200)
        .json({ message: `Social media status toggled`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private addTestimony = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, name, designation, company, testimony } = req.body;

      const uid = req.user.id;
      const cardTestimony: CardTestimony = {
        name,
        designation,
        company,
        testimony,
        userId: uid,
      };
      const card = await this.cardService.addTestimony(
        cardId,
        uid,
        cardTestimony
      );
      res.status(200).json({ message: `Testimony added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteTestimony = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, testimonyId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteTestimony(
        cardId,
        uid,
        testimonyId
      );
      res.status(200).json({ message: `Testimony deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private addcatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, title, imageUrl, description } = req.body;
      const cateloguePhoto = req.file;

      const uid = req.user.id;
      const catelogue: CardCatelog = {
        title,
        imageUrl,
        description,
      };

      const card = await this.cardService.addCardCatelogue(
        cardId,
        uid,
        catelogue,
        cateloguePhoto
      );
      res.status(200).json({ message: `Catelogue added`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private updateCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, catelogId, title, imageUrl, description } = req.body;
      const uid = req.user.id;
      const catelogue: CardCatelog = {
        title,
        imageUrl,
        description,
      };

      const card = await this.cardService.updateCardCatelog(
        cardId,
        catelogId,
        catelogue
      );
      res.status(200).json({ message: `Catelogue updated`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private deleteCatelogue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId, catelogueId } = req.body;
      const uid = req.user.id;

      const card = await this.cardService.deleteCardCatelog(
        cardId,
        catelogueId
      );
      res.status(200).json({ message: `Catelogue deleted`, payload: { card } });
    } catch (error) {
      next(error);
    }
  };

  private shareCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      const { recipientId } = req.body;

      if (!cardId || !recipientId) {
        throw new HttpException(
          400,
          "missing",
          "Card ID and Recipient ID are required"
        );
      }

      const uid = req.user.id;

      const updatedCard = await this.cardService.shareCard(
        cardId,
        uid,
        recipientId
      );

      // Generate shareable link
      const baseUrl = process.env.FRONTEND_BASE_URL;
      const shareableLink = `${baseUrl}/#/view-card/${cardId}`;

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Card shared successfully",
        payload: { updatedCard, shareableLink },
      });
    } catch (error) {
      next(error);
    }
  };

  private generateQrShareLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;

      if (!cardId) {
        throw new HttpException(400, "missing", "Card ID is required");
      }

      // Ensure the card exists
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new HttpException(404, "not_found", "Card not found");
      }

      // Generate public shareable link (no recipient required)
      const baseUrl = process.env.FRONTEND_BASE_URL;
      const qrShareableLink = `${baseUrl}/#/view-card/${cardId}`;

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "QR share link generated successfully",
        payload: { qrShareableLink },
      });
    } catch (error) {
      next(error);
    }
  };

  private generateVCFLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide card ID");
      }

      // Ensure the card exists
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new HttpException(404, "not_found", "Card not found");
      }

      // Generate VCF download link
      const apiBaseUrl =
        process.env.BACKEND_BACK_END_URL?.replace(/\/$/, "") ||
        process.env.API_BASE_URL ||
        process.env.BACKEND_BASE_URL ||
        "http://localhost:3000";
      const vcfDownloadLink = `${apiBaseUrl}/api/cards/download-vcf/${cardId}`;

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "VCF link generated successfully",
        payload: { vcfDownloadLink },
      });
    } catch (error) {
      next(error);
    }
  };

  private viewCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide id");
      }

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        res.status(404).json({ message: "Card not found" });
      }
      res.json({ card });
    } catch (error) {
      next(error);
    }
  };

  private downloadVCF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { cardId } = req.params;
      if (!cardId) {
        throw new HttpException(400, "missing", "Please provide card ID");
      }

      // Generate VCF content
      const vcfContent = await this.cardService.generateVCF(cardId);

      // Get card for filename
      const card = await this.cardService.getCardById(cardId);
      const fullName = `${card?.firstName || "contact"}_${card?.lastName || "card"
        }`;
      const filename = `${fullName.replace(/\s+/g, "_")}.vcf`;

      // Set headers for VCF download
      res.setHeader("Content-Type", "text/vcard");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Send VCF content
      res.send(vcfContent);
    } catch (error) {
      next(error);
    }
  };

  private connectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => { };
  private acceptConnectionRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => { };
}
export default CardController;
