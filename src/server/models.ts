import mongoose, { Schema, type InferSchemaType } from "mongoose";

const { ObjectId, Mixed } = Schema.Types;
const model = <T>(name: string, schema: Schema<T>) =>
  (mongoose.models[name] as mongoose.Model<T> | undefined) ?? mongoose.model<T>(name, schema);

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, trim: true },
    altText: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, min: 0, default: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  { _id: true },
);

const propertySchema = new Schema(
  {
    source: {
      type: String,
      enum: ["admin", "auction", "automation", "repliers", "rentcast", "import"],
      required: true,
    },
    sourceListingId: { type: String, required: true, trim: true },
    legacyId: { type: String, trim: true, index: true },
    sourceUrl: { type: String, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    price: { type: Number, min: 0 },
    currency: { type: String, required: true, default: "USD", uppercase: true, maxlength: 3 },
    country: { type: String, required: true, default: "United States", index: true },
    state: { type: String, trim: true, index: true },
    prefecture: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },
    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    location: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    geoPoint: {
      type: { type: String, enum: ["Point"] },
      coordinates: {
        type: [Number],
        validate: (coordinates: number[]) => coordinates.length === 2,
      },
    },
    propertyType: { type: String, trim: true },
    foreclosureStatus: { type: String, trim: true, index: true },
    listingType: { type: String, enum: ["sale", "rent", "auction", "unknown"], default: "unknown" },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    landArea: { type: Number, min: 0 },
    buildingArea: { type: Number, min: 0 },
    yearBuilt: { type: Number, min: 0 },
    description: { type: String, maxlength: 30000 },
    features: { type: [String], default: [] },
    nearbyPlaces: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "active", "pending", "sold", "inactive"],
      default: "published",
      index: true,
    },
    auctionDate: { type: Date, index: true },
    lastCheckedAt: { type: Date },
    createdBy: { type: ObjectId, ref: "User" },
    metadata: { type: Mixed, default: {} },
  },
  { timestamps: true, collection: "properties", strict: true },
);
propertySchema.index({ source: 1, sourceListingId: 1 }, { unique: true });
propertySchema.index({ status: 1, country: 1, createdAt: -1 });
propertySchema.index(
  { status: 1, country: 1, state: 1, city: 1, price: 1 },
  { collation: { locale: "en", strength: 2 } },
);
propertySchema.index(
  { propertyType: 1, bedrooms: 1, price: 1 },
  { collation: { locale: "en", strength: 2 } },
);
propertySchema.index({ postalCode: 1, status: 1, price: 1 });
propertySchema.index({ geoPoint: "2dsphere" }, { sparse: true });
propertySchema.index({ auctionDate: 1, status: 1 });
propertySchema.index({
  title: "text",
  address: "text",
  city: "text",
  state: "text",
  description: "text",
});

const userSchema = new Schema(
  {
    legacyAuthId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, select: false },
    displayName: { type: String, trim: true, maxlength: 160 },
    roles: { type: [String], enum: ["admin", "moderator", "user"], default: ["user"] },
    emailVerifiedAt: { type: Date },
    disabledAt: { type: Date },
    authMetadata: { type: Mixed, default: {} },
  },
  { timestamps: true, collection: "users" },
);
userSchema.index({ email: 1 }, { unique: true });

const refreshSessionSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    userAgent: { type: String, maxlength: 1000 },
    ipHash: { type: String, maxlength: 128 },
  },
  { timestamps: true, collection: "authSessions" },
);
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const passwordResetSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true, collection: "passwordResetTokens" },
);
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const emailVerificationSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true, collection: "emailVerificationTokens" },
);
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const savedSearchSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    legacyId: { type: String, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    filters: { type: Mixed, required: true, default: {} },
    criteriaHash: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    alertsEnabled: { type: Boolean, default: false },
    alertFrequency: { type: String, enum: ["disabled", "daily", "weekly"], default: "disabled" },
    lastCheckedAt: { type: Date },
    lastMatchCount: { type: Number, min: 0 },
    matchCountCheckedAt: { type: Date },
    lastNotificationAt: { type: Date },
  },
  { timestamps: true, collection: "savedSearches" },
);
savedSearchSchema.index({ userId: 1, criteriaHash: 1 }, { unique: true });
savedSearchSchema.index(
  { alertFrequency: 1, lastCheckedAt: 1 },
  { partialFilterExpression: { alertsEnabled: true } },
);

const savedSearchMatchSchema = new Schema(
  {
    savedSearchId: { type: ObjectId, ref: "SavedSearch", required: true },
    source: { type: String, required: true },
    listingId: { type: String, required: true },
    listingState: { type: Mixed, default: {} },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "savedSearchMatches" },
);
savedSearchMatchSchema.index({ savedSearchId: 1, source: 1, listingId: 1 }, { unique: true });

const savedSearchEventSchema = new Schema(
  {
    savedSearchId: { type: ObjectId, ref: "SavedSearch", required: true },
    source: { type: String, required: true },
    listingId: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["new", "price_changed", "status_changed", "auction_changed"],
      required: true,
    },
    eventKey: { type: String, required: true, unique: true },
    previousValue: { type: Mixed },
    currentValue: { type: Mixed },
    sentAt: { type: Date },
  },
  { timestamps: true, collection: "savedSearchEvents" },
);
savedSearchEventSchema.index({ createdAt: 1 }, { partialFilterExpression: { sentAt: null } });

const issueReportSchema = new Schema(
  {
    legacyId: { type: String, index: true },
    listingId: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    issueType: {
      type: String,
      enum: ["price", "availability", "details", "source", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    contactEmail: { type: String, trim: true, maxlength: 254 },
    userId: { type: ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "listingIssueReports" },
);
issueReportSchema.index({ createdAt: -1 });

const favoriteSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    propertyId: { type: ObjectId, ref: "Property", required: true },
  },
  { timestamps: true, collection: "favorites" },
);
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const preferenceSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, unique: true },
    preferences: { type: Mixed, default: {} },
  },
  { timestamps: true, collection: "userPreferences" },
);

const comparisonSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, unique: true },
    items: { type: [Mixed], default: [] },
    assumptions: { type: Mixed, default: {} },
  },
  { timestamps: true, collection: "propertyComparisons" },
);

const chatSessionSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", index: true },
    visitorId: { type: String, index: true },
    title: { type: String, maxlength: 300 },
    currentPropertyId: { type: String, maxlength: 120 },
    context: { type: Mixed, default: {} },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "chat_sessions" },
);
chatSessionSchema.index({ userId: 1, updatedAt: -1 });
chatSessionSchema.index({ visitorId: 1, updatedAt: -1 });
chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const chatMessageSchema = new Schema(
  {
    sessionId: { type: ObjectId, ref: "ChatSession", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 30000 },
    toolCalls: { type: [String], default: [] },
    metadata: { type: Mixed, default: {} },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "chat_messages" },
);
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const knowledgeBaseSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    category: { type: String, required: true, index: true },
    content: { type: String, required: true, maxlength: 30000 },
    sourceUrl: { type: String, trim: true },
    reviewedAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "knowledgeBase" },
);
knowledgeBaseSchema.index({ title: "text", content: "text" });

const apiRateLimitSchema = new Schema(
  {
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "apiRateLimits", versionKey: false },
);
apiRateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true });
apiRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const searchCacheSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: "searchCache", versionKey: false },
);
searchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const contactInquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    subject: { type: String, maxlength: 300 },
    message: { type: String, required: true, maxlength: 10000 },
    status: { type: String, enum: ["new", "in_progress", "closed"], default: "new" },
  },
  { timestamps: true, collection: "contactInquiries" },
);

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
    source: { type: String, maxlength: 200 },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date },
  },
  { timestamps: true, collection: "newsletterSubscriptions" },
);
newsletterSchema.index({ email: 1 }, { unique: true });

const syncLogSchema = new Schema(
  {
    source: { type: String, required: true, index: true },
    status: { type: String, enum: ["running", "complete", "failed"], required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    recordsRead: { type: Number, min: 0, default: 0 },
    recordsWritten: { type: Number, min: 0, default: 0 },
    cursor: { type: String },
    errorSummary: { type: String, maxlength: 4000 },
    metadata: { type: Mixed },
  },
  { timestamps: true, collection: "propertySyncLogs" },
);
syncLogSchema.index({ source: 1, startedAt: -1 });

const storageObjectSchema = new Schema(
  {
    legacyPath: { type: String, required: true, unique: true },
    objectKey: { type: String, required: true, unique: true },
    contentType: { type: String },
    size: { type: Number, min: 0 },
    etag: { type: String },
    url: { type: String },
    metadata: { type: Mixed },
  },
  { timestamps: true, collection: "storageObjects" },
);

const monitorLeaseSchema = new Schema(
  {
    _id: { type: String, default: "saved-search-monitor" },
    lockedUntil: { type: Date },
    lastSearchId: { type: String },
    owner: { type: String },
  },
  { timestamps: true, collection: "jobLeases" },
);

export const User = model("User", userSchema);
export const PropertyModel = model("Property", propertySchema);
export const AuthSession = model("AuthSession", refreshSessionSchema);
export const PasswordResetToken = model("PasswordResetToken", passwordResetSchema);
export const EmailVerificationToken = model("EmailVerificationToken", emailVerificationSchema);
export const SavedSearch = model("SavedSearch", savedSearchSchema);
export const SavedSearchMatch = model("SavedSearchMatch", savedSearchMatchSchema);
export const SavedSearchEvent = model("SavedSearchEvent", savedSearchEventSchema);
export const ListingIssueReport = model("ListingIssueReport", issueReportSchema);
export const Favorite = model("Favorite", favoriteSchema);
export const UserPreference = model("UserPreference", preferenceSchema);
export const PropertyComparison = model("PropertyComparison", comparisonSchema);
export const ChatSession = model("ChatSession", chatSessionSchema);
export const ChatMessage = model("ChatMessage", chatMessageSchema);
export const KnowledgeBase = model("KnowledgeBase", knowledgeBaseSchema);
export const ApiRateLimit = model("ApiRateLimit", apiRateLimitSchema);
export const SearchCache = model("SearchCache", searchCacheSchema);
export const ContactInquiry = model("ContactInquiry", contactInquirySchema);
export const NewsletterSubscription = model("NewsletterSubscription", newsletterSchema);
export const PropertySyncLog = model("PropertySyncLog", syncLogSchema);
export const StorageObject = model("StorageObject", storageObjectSchema);
export const JobLease = model("JobLease", monitorLeaseSchema);

export const mongoModels: mongoose.Model<unknown>[] = [
  User,
  PropertyModel,
  AuthSession,
  PasswordResetToken,
  EmailVerificationToken,
  SavedSearch,
  SavedSearchMatch,
  SavedSearchEvent,
  ListingIssueReport,
  Favorite,
  UserPreference,
  PropertyComparison,
  ChatSession,
  ChatMessage,
  KnowledgeBase,
  ApiRateLimit,
  SearchCache,
  ContactInquiry,
  NewsletterSubscription,
  PropertySyncLog,
  StorageObject,
  JobLease,
];

export type UserDocument = InferSchemaType<typeof userSchema>;
