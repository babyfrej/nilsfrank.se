CREATE TABLE `rsvp` (
	`tenant` text NOT NULL,
	`event` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`slot_id` text,
	`attending` integer NOT NULL,
	`adults` integer NOT NULL,
	`children` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`tenant`, `event`, `email`)
);
