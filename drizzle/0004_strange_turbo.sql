CREATE TABLE `held_carts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`label` varchar(80) NOT NULL,
	`cart` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `held_carts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`sale_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`hsn` varchar(8),
	`schedule` enum('none','H','H1','X') NOT NULL,
	`batch` varchar(40) NOT NULL,
	`expiry` date,
	`qty` int NOT NULL,
	`mrp` decimal(12,2) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`gst_rate` decimal(4,2) NOT NULL,
	`discount` decimal(12,2) NOT NULL,
	`taxable` decimal(12,2) NOT NULL,
	`cgst` decimal(12,2) NOT NULL,
	`sgst` decimal(12,2) NOT NULL,
	`net` decimal(12,2) NOT NULL,
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`invoice_no` varchar(20) NOT NULL,
	`till_code` varchar(4) NOT NULL,
	`customer_id` varchar(36),
	`customer_name` varchar(120),
	`customer_phone` varchar(10),
	`doctor_name` varchar(120),
	`patient_name` varchar(120),
	`discount_pct` decimal(5,2) NOT NULL,
	`gross` decimal(12,2) NOT NULL,
	`discount` decimal(12,2) NOT NULL,
	`taxable` decimal(12,2) NOT NULL,
	`cgst` decimal(12,2) NOT NULL,
	`sgst` decimal(12,2) NOT NULL,
	`round_off` decimal(12,2) NOT NULL,
	`payable` decimal(12,2) NOT NULL,
	`payment_method` enum('cash','upi','card','credit') NOT NULL,
	`tendered` decimal(12,2),
	`status` enum('completed','returned') NOT NULL DEFAULT 'completed',
	`user_id` varchar(36) NOT NULL,
	`sold_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_tenant_invoice_uq` UNIQUE(`tenant_id`,`invoice_no`)
);
--> statement-breakpoint
CREATE TABLE `tenant_settings` (
	`tenant_id` varchar(36) NOT NULL,
	`address` varchar(255) NOT NULL DEFAULT '',
	`phone` varchar(20) NOT NULL DEFAULT '',
	`drug_licence` varchar(80) NOT NULL DEFAULT '',
	`footer` varchar(255) NOT NULL DEFAULT 'Get well soon.',
	`default_discount_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `tenant_settings_tenant_id` PRIMARY KEY(`tenant_id`)
);
--> statement-breakpoint
CREATE TABLE `tills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`code` varchar(4) NOT NULL,
	`name` varchar(60) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `tills_id` PRIMARY KEY(`id`),
	CONSTRAINT `tills_tenant_code_uq` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
ALTER TABLE `held_carts` ADD CONSTRAINT `held_carts_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `held_carts` ADD CONSTRAINT `held_carts_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_settings` ADD CONSTRAINT `tenant_settings_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tills` ADD CONSTRAINT `tills_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `held_carts_tenant_idx` ON `held_carts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_tenant_product_idx` ON `sale_items` (`tenant_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `sales_tenant_sold_idx` ON `sales` (`tenant_id`,`sold_at`);--> statement-breakpoint
CREATE INDEX `sales_tenant_customer_idx` ON `sales` (`tenant_id`,`customer_id`);