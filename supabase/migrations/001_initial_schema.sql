-- ============================================================
-- CarNet - Schéma initial Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- ----------------------
-- Table: profiles
-- Profils utilisateurs (liés à auth.users)
-- ----------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name      TEXT,
  email     TEXT,
  phone     TEXT,
  avatar_url TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- Table: vehicles
-- Véhicules des utilisateurs
-- ----------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plate      TEXT NOT NULL,
  brand      TEXT NOT NULL,
  model      TEXT NOT NULL,
  year       INTEGER NOT NULL,
  fuel       TEXT NOT NULL,
  color      TEXT,
  vin        TEXT,
  image_uri  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- Table: mileage_entries
-- Relevés kilométriques
-- ----------------------
CREATE TABLE IF NOT EXISTS public.mileage_entries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  value      INTEGER NOT NULL,
  date       TIMESTAMPTZ NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- Table: maintenance_tasks
-- Tâches d'entretien
-- ----------------------
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id        UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  due_date          TIMESTAMPTZ,
  due_mileage       INTEGER,
  completed_date    TIMESTAMPTZ,
  completed_mileage INTEGER,
  status            TEXT DEFAULT 'pending',
  notes             TEXT,
  cost              DECIMAL(10, 2),
  garage            TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- Table: invoices
-- Factures d'entretien
-- ----------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id          UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title               TEXT NOT NULL,
  amount              DECIMAL(10, 2) NOT NULL,
  date                TIMESTAMPTZ NOT NULL,
  category            TEXT NOT NULL,
  garage              TEXT,
  image_url           TEXT,
  pdf_url             TEXT,
  ocr_text            TEXT,
  maintenance_task_id UUID REFERENCES public.maintenance_tasks(id) ON DELETE SET NULL,
  tags                TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- Table: sale_transfers
-- Codes de cession de véhicule
-- ----------------------
CREATE TABLE IF NOT EXISTS public.sale_transfers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id  UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false,
  buyer_email TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_transfers     ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- vehicles
CREATE POLICY "vehicles_all" ON public.vehicles FOR ALL USING (auth.uid() = user_id);

-- mileage_entries (accès via véhicule)
CREATE POLICY "mileage_entries_all" ON public.mileage_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = mileage_entries.vehicle_id
        AND vehicles.user_id = auth.uid()
    )
  );

-- maintenance_tasks
CREATE POLICY "maintenance_tasks_all" ON public.maintenance_tasks FOR ALL USING (auth.uid() = user_id);

-- invoices
CREATE POLICY "invoices_all" ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- sale_transfers
CREATE POLICY "sale_transfers_all" ON public.sale_transfers FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger : création automatique du profil à l'inscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Index pour les performances
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id          ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_entries_vehicle   ON public.mileage_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_user_id       ON public.maintenance_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id    ON public.maintenance_tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id          ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id       ON public.invoices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sale_transfers_user_id    ON public.sale_transfers(user_id);
