CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`pharmacy` varchar(120) NOT NULL,
	`phone` varchar(10) NOT NULL,
	`area` varchar(80) NOT NULL,
	`counters` int NOT NULL,
	`message` varchar(500),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
