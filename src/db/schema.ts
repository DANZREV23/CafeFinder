import { pgTable, serial, text, varchar, timestamp, integer, boolean, decimal, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["USER", "OWNER", "ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE", "SUSPENDED"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID
  name: text("name").notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("USER").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cafes = pgTable("cafes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  website: text("website"),
  priceRange: integer("price_range").default(1),
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(),
  verified: boolean("verified").default(false),
  featured: boolean("featured").default(false),
  trending: boolean("trending").default(false),
  ratingAverage: decimal("rating_average", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const amenities = pgTable("amenities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
});

export const cafeAmenities = pgTable("cafe_amenities", {
  cafeId: integer("cafe_id").references(() => cafes.id, { onDelete: "cascade" }).notNull(),
  amenityId: integer("amenity_id").references(() => amenities.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.cafeId, t.amenityId] }),
}));

export const cafePhotos = pgTable("cafe_photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
  isCover: boolean("is_cover").default(false),
  cafeId: integer("cafe_id").references(() => cafes.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cafeHours = pgTable("cafe_hours", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: varchar("open_time", { length: 10 }),
  closeTime: varchar("close_time", { length: 10 }),
  isClosed: boolean("is_closed").default(false),
  cafeId: integer("cafe_id").references(() => cafes.id, { onDelete: "cascade" }).notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  ratingOverall: integer("rating_overall").notNull(),
  ratingCoffee: integer("rating_coffee").default(0),
  ratingAmbiance: integer("rating_ambiance").default(0),
  ratingService: integer("rating_service").default(0),
  comment: text("comment"),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  cafeId: integer("cafe_id").references(() => cafes.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cafeId: integer("cafe_id").references(() => cafes.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.cafeId] }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  favorites: many(favorites),
  cafes: many(cafes), // owned cafes
}));

export const cafesRelations = relations(cafes, ({ one, many }) => ({
  owner: one(users, { fields: [cafes.ownerId], references: [users.id] }),
  amenities: many(cafeAmenities),
  photos: many(cafePhotos),
  hours: many(cafeHours),
  reviews: many(reviews),
  favorites: many(favorites),
}));

export const cafeAmenitiesRelations = relations(cafeAmenities, ({ one }) => ({
  cafe: one(cafes, { fields: [cafeAmenities.cafeId], references: [cafes.id] }),
  amenity: one(amenities, { fields: [cafeAmenities.amenityId], references: [amenities.id] }),
}));

export const cafePhotosRelations = relations(cafePhotos, ({ one }) => ({
  cafe: one(cafes, { fields: [cafePhotos.cafeId], references: [cafes.id] }),
}));

export const cafeHoursRelations = relations(cafeHours, ({ one }) => ({
  cafe: one(cafes, { fields: [cafeHours.cafeId], references: [cafes.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  cafe: one(cafes, { fields: [reviews.cafeId], references: [cafes.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  cafe: one(cafes, { fields: [favorites.cafeId], references: [cafes.id] }),
}));
