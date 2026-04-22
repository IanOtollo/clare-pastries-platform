import {
  pgTable,
  text,
  serial,
  boolean,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceKes: numeric("price_kes").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  featured: boolean("featured").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  servings: text("servings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customOrders = pgTable("custom_orders", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  occasion: text("occasion").notNull(),
  description: text("description").notNull(),
  servings: integer("servings"),
  preferredDate: text("preferred_date"),
  budget: text("budget"),
  fulfillment: text("fulfillment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  location: text("location"),
  approved: boolean("approved").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  productId: integer("product_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
