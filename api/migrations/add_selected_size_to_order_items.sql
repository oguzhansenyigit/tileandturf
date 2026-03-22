-- Add selected_size column for color dimension selection (e.g. 24x24, 24x48)
ALTER TABLE order_items ADD COLUMN selected_size VARCHAR(50) NULL AFTER subtotal;
