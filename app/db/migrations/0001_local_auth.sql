ALTER TABLE `users` ADD `passwordHash` text;
CREATE INDEX `email_idx` ON `users` (`email`);
