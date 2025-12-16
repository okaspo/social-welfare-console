-- Seed Data for Phase 1
-- Assistant Profiles

INSERT INTO public.assistant_profiles (code, name, avatar_url)
VALUES 
    ('aoi', '葵 (Aoi)', '/assets/avatars/aoi_face_icon.jpg'),
    ('aki', '秋 (Aki)', '/assets/avatars/aki_face_icon.jpg'),
    ('ami', '亜美 (Ami)', '/assets/avatars/ami_face_icon.jpg')
ON CONFLICT (code) DO UPDATE
SET 
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;
