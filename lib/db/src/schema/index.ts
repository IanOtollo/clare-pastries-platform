import {
  pgTable,
  text,
  serial,
  boolean,
  timestamp,
  integer,
  numeric,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  status: text("status").notNull().default("new"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
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

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("CUSTOMER"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  }),
);

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  fulfillment: text("fulfillment").notNull().default("delivery"),
  address: text("address"),
  notes: text("notes"),
  subtotalKes: numeric("subtotal_kes").notNull(),
  deliveryKes: numeric("delivery_kes").notNull().default("0"),
  discountKes: numeric("discount_kes").notNull().default("0"),
  totalKes: numeric("total_kes").notNull(),
  currency: text("currency").notNull().default("KES"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("mpesa"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentRef: text("payment_ref"),
  offerCode: text("offer_code"),
  channel: text("channel").notNull().default("online"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  priceKes: numeric("price_kes").notNull(),
  quantity: integer("quantity").notNull(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  discountType: text("discount_type").notNull().default("percent"),
  discountValue: numeric("discount_value").notNull(),
  minSubtotalKes: numeric("min_subtotal_kes").notNull().default("0"),
  active: boolean("active").notNull().default(true),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
