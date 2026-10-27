ALTER TABLE `tenant_payments` ADD `request_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `tenant_payments` ADD CONSTRAINT `tenant_payments_request_id_unique` UNIQUE(`request_id`);