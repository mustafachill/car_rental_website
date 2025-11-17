-- Add pricing tier columns to Cars table
ALTER TABLE Cars
ADD COLUMN hourly_rate DECIMAL(10,2) NULL AFTER daily_rate,
ADD COLUMN weekly_rate DECIMAL(10,2) NULL AFTER hourly_rate,
ADD COLUMN monthly_rate DECIMAL(10,2) NULL AFTER weekly_rate;

-- Update existing cars with calculated rates based on daily_rate
-- Hourly = daily_rate / 8 (assuming 8-hour rental day)
-- Weekly = daily_rate * 6 (1 day free discount)
-- Monthly = daily_rate * 25 (5 days free discount)
UPDATE Cars
SET
    hourly_rate = ROUND(daily_rate / 8, 2),
    weekly_rate = ROUND(daily_rate * 6, 2),
    monthly_rate = ROUND(daily_rate * 25, 2)
WHERE daily_rate IS NOT NULL;
