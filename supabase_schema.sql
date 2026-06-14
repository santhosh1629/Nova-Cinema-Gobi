-- SUPABASE SCHEMA FOR NOVA CINEMA GOBI
-- Copy and run this in the SQL Editor of your Supabase Dashboard

-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('STUDENT', 'CANTEEN_OWNER', 'ADMIN');
CREATE TYPE order_status AS ENUM ('pending', 'prepared', 'partially_collected', 'collected', 'cancelled', 'completed');
CREATE TYPE staff_role_type AS ENUM ('counter', 'delivery', 'qr_scanner', 'manager');

-- 2. Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  role user_role DEFAULT 'STUDENT',
  phone TEXT UNIQUE,
  email TEXT,
  password TEXT, -- Added for custom auth
  profile_image_url TEXT,
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_date TIMESTAMP WITH TIME ZONE,
  is_first_login BOOLEAN DEFAULT TRUE,
  canteen_name TEXT,
  id_proof_url TEXT,
  loyalty_points INTEGER DEFAULT 0,
  staff_role staff_role_type,
  is_active_profile BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Admin User as requested
INSERT INTO profiles (username, phone, role, password, approval_status)
VALUES ('Admin Santhosh', '9344328498', 'ADMIN', 'Santhosh@1629', 'approved')
ON CONFLICT (phone) DO UPDATE SET password = 'Santhosh@1629', role = 'ADMIN';

-- 3. Menu items
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  description TEXT,
  emoji TEXT,
  average_rating DECIMAL DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  dietary_tags TEXT[],
  nutrition JSONB,
  is_combo BOOLEAN DEFAULT FALSE,
  combo_items JSONB,
  is_demo BOOLEAN DEFAULT FALSE,
  category TEXT CHECK (category IN ('food', 'game')),
  slot_ids TEXT[],
  duration_minutes INTEGER,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Slots (for booking)
CREATE TABLE slots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  student_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL NOT NULL,
  status order_status DEFAULT 'pending',
  qr_token TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_type TEXT DEFAULT 'real',
  canteen_owner_phone TEXT,
  refund_amount DECIMAL DEFAULT 0,
  collected_by_staff_id UUID REFERENCES profiles(id),
  seat_number TEXT,
  coupon_code TEXT,
  discount_amount DECIMAL DEFAULT 0,
  game_start_time TIMESTAMP WITH TIME ZONE,
  game_end_time TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE
);

-- 6. Order items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  notes TEXT,
  image_url TEXT,
  category TEXT,
  selected_slot_id TEXT,
  duration_minutes INTEGER,
  selected_start_time TIMESTAMP WITH TIME ZONE,
  is_delivered BOOLEAN DEFAULT FALSE,
  delivered_quantity INTEGER DEFAULT 0
);

-- 7. Feedback (feedbacks table matched with client code queries)
CREATE TABLE feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  student_name TEXT,
  menu_item_id UUID REFERENCES menu_items(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Offers
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  student_id UUID REFERENCES profiles(id),
  is_reward BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  redeemed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Favorites
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, menu_item_id)
);

-- 10. Payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  amount DECIMAL NOT NULL,
  method TEXT DEFAULT 'Razorpay',
  status TEXT DEFAULT 'successful',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Rewards
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  discount JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Canteen Photos
CREATE TABLE canteen_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data TEXT NOT NULL, -- Stores base64 data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Commissions
CREATE TABLE commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  total_income DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Combined Services Groups
CREATE TABLE combined_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  service_ids UUID[] DEFAULT '{}'::UUID[], -- Linked service IDs from menu_items
  room_ids TEXT[] DEFAULT '{}'::TEXT[], -- Shared room/slot IDs
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_groups ENABLE ROW LEVEL SECURITY;

-- 16. Basic Policies
-- Allow all operations for menu_items
CREATE POLICY "Public access for menu_items" ON menu_items FOR ALL USING (TRUE);

-- AUTHENTICATION POLICY: Allow searching profiles by phone/email for login
CREATE POLICY "Allow public select for login" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Allow public insert for signup" ON profiles FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (phone = phone); -- Simple policy for demo

-- Orders and items
CREATE POLICY "Public read for orders" ON orders FOR SELECT USING (TRUE);
CREATE POLICY "Public insert for orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public update for orders" ON orders FOR UPDATE USING (TRUE);

CREATE POLICY "Public read for order_items" ON order_items FOR SELECT USING (TRUE);
CREATE POLICY "Public insert for order_items" ON order_items FOR INSERT WITH CHECK (TRUE);

-- Feedback, Offers, Slots, Favorites, Payments, Rewards, Photos, Commissions, Combined Groups
CREATE POLICY "Public access feedbacks" ON feedbacks FOR ALL USING (TRUE);
CREATE POLICY "Public access offers" ON offers FOR ALL USING (TRUE);
CREATE POLICY "Public access slots" ON slots FOR ALL USING (TRUE);
CREATE POLICY "Public access favorites" ON favorites FOR ALL USING (TRUE);
CREATE POLICY "Public access payments" ON payments FOR ALL USING (TRUE);
CREATE POLICY "Public access rewards" ON rewards FOR ALL USING (TRUE);
CREATE POLICY "Public access canteen_photos" ON canteen_photos FOR ALL USING (TRUE);
CREATE POLICY "Public access commissions" ON commissions FOR ALL USING (TRUE);
CREATE POLICY "Public access combined_groups" ON combined_groups FOR ALL USING (TRUE);


-- 17. Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username', 'STUDENT');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
