import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AuthSession,
  ApiRateLimit,
  ChatSession,
  ChatMessage,
  ContactInquiry,
  EmailVerificationToken,
  Favorite,
  JobLease,
  ListingIssueReport,
  KnowledgeBase,
  NewsletterSubscription,
  PasswordResetToken,
  PropertyComparison,
  PropertyModel,
  PropertySyncLog,
  SavedSearch,
  SavedSearchEvent,
  SavedSearchMatch,
  SearchCache,
  StorageObject,
  User,
  UserPreference,
  mongoModels,
} from "./models.ts";

test("all application collections are registered as Mongoose models", () => {
  assert.deepEqual(
    mongoModels.map((model) => model.collection.collectionName).sort(),
    [
      "authSessions",
      "apiRateLimits",
      "chat_sessions",
      "chat_messages",
      "contactInquiries",
      "emailVerificationTokens",
      "favorites",
      "jobLeases",
      "listingIssueReports",
      "knowledgeBase",
      "newsletterSubscriptions",
      "passwordResetTokens",
      "properties",
      "propertyComparisons",
      "propertySyncLogs",
      "savedSearches",
      "savedSearchEvents",
      "savedSearchMatches",
      "searchCache",
      "storageObjects",
      "userPreferences",
      "users",
    ].sort(),
  );
});

test("properties have unique source IDs, searchable text and bounded coordinates", () => {
  assert.equal(PropertyModel.schema.path("sourceListingId").isRequired, true);
  assert.ok(
    PropertyModel.schema
      .indexes()
      .some(
        ([keys, options]) =>
          keys["source"] === 1 && keys["sourceListingId"] === 1 && options.unique === true,
      ),
  );
  assert.ok(PropertyModel.schema.indexes().some(([keys]) => keys["title"] === "text"));
  assert.equal(PropertyModel.schema.path("latitude").options["min"], -90);
  assert.equal(PropertyModel.schema.path("longitude").options["max"], 180);
  assert.ok(PropertyModel.schema.path("auctionDate"));
  assert.ok(PropertyModel.schema.path("foreclosureStatus"));
  assert.ok(PropertyModel.schema.indexes().some(([keys]) => keys["geoPoint"] === "2dsphere"));
});

test("user identity, roles, hashed sessions and reset tokens have uniqueness and expiry indexes", () => {
  assert.equal(User.schema.path("email").isRequired, true);
  assert.ok(User.schema.path("passwordHash").options["select"] === false);
  assert.ok(User.schema.indexes().some(([keys, options]) => keys["email"] === 1 && options.unique));
  assert.ok(
    AuthSession.schema
      .indexes()
      .some(([keys, options]) => keys["expiresAt"] === 1 && options.expireAfterSeconds === 0),
  );
  assert.ok(
    PasswordResetToken.schema
      .indexes()
      .some(([keys, options]) => keys["expiresAt"] === 1 && options.expireAfterSeconds === 0),
  );
  assert.ok(
    EmailVerificationToken.schema
      .indexes()
      .some(([keys, options]) => keys["expiresAt"] === 1 && options.expireAfterSeconds === 0),
  );
});

test("saved-search, favorite, report, storage and operational collections declare required keys", () => {
  assert.equal(SavedSearch.schema.path("criteriaHash").isRequired, true);
  assert.ok(
    SavedSearchMatch.schema
      .indexes()
      .some(([keys, options]) => keys["savedSearchId"] === 1 && options.unique),
  );
  assert.ok(
    SavedSearchEvent.schema
      .indexes()
      .some(([keys, options]) => keys["eventKey"] === 1 && options.unique),
  );
  assert.ok(
    Favorite.schema.indexes().some(([keys, options]) => keys["userId"] === 1 && options.unique),
  );
  assert.equal(ListingIssueReport.schema.path("description").options["maxlength"], 2000);
  assert.ok(
    StorageObject.schema
      .indexes()
      .some(([keys, options]) => keys["legacyPath"] === 1 && options.unique),
  );
  assert.equal(JobLease.schema.path("_id").options["default"], "saved-search-monitor");
  assert.equal(UserPreference.schema.path("userId").options["unique"], true);
  assert.equal(PropertyComparison.schema.path("userId").options["unique"], true);
  assert.ok(ChatSession.schema.indexes().some(([keys]) => keys["expiresAt"] === 1));
  assert.ok(ChatMessage.schema.path("sessionId"));
  assert.ok(KnowledgeBase.schema.path("content"));
  assert.ok(ApiRateLimit.schema.path("count"));
  assert.ok(SearchCache.schema.path("expiresAt"));
  assert.ok(ContactInquiry.schema.path("message"));
  assert.equal(NewsletterSubscription.schema.path("email").isRequired, true);
  assert.ok(PropertySyncLog.schema.path("recordsWritten"));
});
