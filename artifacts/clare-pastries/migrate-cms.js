import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.fduoacyykjsqpmraajua:oCPQpL64PuORMy8p@aws-1-eu-west-3.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  
  const query = `
    -- Gallery Images
    CREATE TABLE IF NOT EXISTS public.gallery_images (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      category text NOT NULL,
      caption text,
      image_url text NOT NULL,
      product_slug text,
      featured boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT now()
    );

    -- Site Settings (Single Row Table)
    CREATE TABLE IF NOT EXISTS public.site_settings (
      id text PRIMARY KEY DEFAULT 'global',
      business_name text NOT NULL DEFAULT 'Clare Pastries',
      phone text NOT NULL DEFAULT '+254724848228',
      location text NOT NULL DEFAULT 'Busia Town, Kenya',
      delivery_fee_kes integer NOT NULL DEFAULT 100,
      delivery_estimate text NOT NULL DEFAULT '45-90 minutes',
      pickup_estimate text NOT NULL DEFAULT '30-60 minutes',
      announcement_enabled boolean NOT NULL DEFAULT false,
      announcement_message text DEFAULT '',
      announcement_bg_color text DEFAULT 'bg-primary'
    );

    -- Insert default settings if not exists
    INSERT INTO public.site_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

    -- Setup Storage Bucket for Images
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('images', 'images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    -- Drop policies to recreate them safely
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;

    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
    CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
    CREATE POLICY "Authenticated Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
    CREATE POLICY "Authenticated Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
  `;
  
  await client.query(query);
  console.log('Migration successful!');
  await client.end();
}

run().catch(console.error);
