UPDATE coupons SET max_uses_per_user = NULL;
ALTER TABLE coupons ALTER COLUMN max_uses_per_user SET DEFAULT NULL;