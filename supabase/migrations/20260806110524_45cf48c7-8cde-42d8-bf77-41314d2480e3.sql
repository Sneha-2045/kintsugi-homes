-- roles
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text,
  source_listing_id text NOT NULL UNIQUE,
  title text NOT NULL,
  price numeric,
  currency text NOT NULL DEFAULT 'JPY',
  country text NOT NULL DEFAULT 'Japan',
  prefecture text,
  city text,
  address text,
  latitude double precision,
  longitude double precision,
  property_type text,
  listing_type text NOT NULL DEFAULT 'sale',
  bedrooms integer,
  bathrooms integer,
  land_area numeric,
  building_area numeric,
  year_built integer,
  description text,
  features text[] NOT NULL DEFAULT '{}',
  nearby_places text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_status_check CHECK (status IN ('draft','published')),
  CONSTRAINT properties_listing_type_check CHECK (listing_type IN ('sale','rent'))
);

CREATE INDEX properties_status_idx ON public.properties (status, created_at DESC);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published properties are public" ON public.properties
FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can read all properties" ON public.properties
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert properties" ON public.properties
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update properties" ON public.properties
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete properties" ON public.properties
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- images
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX property_images_property_idx ON public.property_images (property_id, sort_order);

GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images of published properties are public" ON public.property_images
FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.status = 'published'));

CREATE POLICY "Admins can read all images" ON public.property_images
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can write images" ON public.property_images
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));