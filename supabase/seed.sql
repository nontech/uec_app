-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users in auth.users
-- Note: The password will be '123456' for all test users
DO $$
BEGIN
    -- Create Company Admin for TechCorp
    INSERT INTO auth.users (
        instance_id,
        id,
        email,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        encrypted_password,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change,
        email_change_token_new
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        '55555555-6666-7777-8888-999999999999',
        'john@techcorp.de',
        '{"name": "John Doe"}',
        '{"provider": "email", "providers": ["email"]}',
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        crypt('123456', gen_salt('bf')),
        '',
        NOW(),
        '',
        '',
        ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Create Employee for TechCorp
    INSERT INTO auth.users (
        instance_id,
        id,
        email,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        encrypted_password,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change,
        email_change_token_new
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        '66666666-7777-8888-9999-aaaaaaaaaaaa',
        'jane@techcorp.de',
        '{"name": "Jane Smith"}',
        '{"provider": "email", "providers": ["email"]}',
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        crypt('123456', gen_salt('bf')),
        '',
        NOW(),
        '',
        '',
        ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Create Company Admin for MediaGroup
    INSERT INTO auth.users (
        instance_id,
        id,
        email,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role,
        email_confirmed_at,
        created_at,
        updated_at,
        last_sign_in_at,
        encrypted_password,
        confirmation_token,
        recovery_sent_at,
        recovery_token,
        email_change,
        email_change_token_new
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
        'mike@mediagroup.de',
        '{"name": "Mike Johnson"}',
        '{"provider": "email", "providers": ["email"]}',
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        crypt('123456', gen_salt('bf')),
        '',
        NOW(),
        '',
        '',
        ''
    ) ON CONFLICT (id) DO NOTHING;
END
$$;

-- Create identities for the users
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    id,
    id,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
FROM auth.users
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Seed data for addresses
INSERT INTO public.addresses (id, address, postal_code, city, state, country)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Friedrichstr. 123', 10117, 'Berlin', 'Berlin', 'Germany'),
    ('22222222-2222-2222-2222-222222222222', 'Hauptstr. 45', 80331, 'Munich', 'Bavaria', 'Germany'),
    ('33333333-3333-3333-3333-333333333333', 'Königsallee 67', 40212, 'Düsseldorf', 'NRW', 'Germany');

-- Seed data for companies
INSERT INTO public.companies (id, name, description, billing_email, address)
VALUES
    ('11111111-2222-3333-4444-555555555555', 'TechCorp GmbH', 'Leading tech company', 'billing@techcorp.de', '11111111-1111-1111-1111-111111111111'),
    ('22222222-3333-4444-5555-666666666666', 'MediaGroup AG', 'Digital media company', 'billing@mediagroup.de', '22222222-2222-2222-2222-222222222222');

-- Seed data for memberships
INSERT INTO public.memberships (id, company_id, plan_type, status, price_per_meal, start_date)
VALUES
    ('33333333-4444-5555-6666-777777777777', '11111111-2222-3333-4444-555555555555', 'S', 'active', 15, NOW()),
    ('44444444-5555-6666-7777-888888888888', '22222222-3333-4444-5555-666666666666', 'M', 'active', 25, NOW());

-- Seed data for hours_range (opening hours)
INSERT INTO public.hours_range (id, "from", "to")
VALUES
    ('44444444-4444-4444-4444-444444444444', '08:00:00+02', '20:00:00+02'),
    ('55555555-5555-5555-5555-555555555555', '09:00:00+02', '22:00:00+02'),
    ('66666666-6666-6666-6666-666666666666', '11:00:00+02', '23:00:00+02');

-- Seed data for hours_range (lunch hours)
INSERT INTO public.hours_range (id, "from", "to")
VALUES
    ('77777777-7777-7777-7777-777777777777', '11:30:00+02', '14:30:00+02'),
    ('88888888-8888-8888-8888-888888888888', '12:00:00+02', '15:00:00+02'),
    ('99999999-9999-9999-9999-999999999999', '11:00:00+02', '14:00:00+02');

-- Seed data for restaurants
INSERT INTO public.restaurants (id, name, description, cuisine_type, tier, address, opening_hours, lunch_hours)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bella Italia', 'Authentic Italian cuisine', 'Italian', 'S', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Le Gourmet', 'Fine French dining', 'French', 'M', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sushi Master', 'Premium Japanese experience', 'Japanese', 'L', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999');

-- Seed data for menu_items
INSERT INTO public.menu_items (id, restaurant_id, name, description, price, is_available, category, days)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Margherita Pizza', 'Classic tomato and mozzarella', '12.99', true, 'Main', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Coq au Vin', 'Traditional French chicken stew', '24.99', true, 'Main', ARRAY['Monday', 'Wednesday', 'Friday']),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sushi Platter', 'Assorted premium sushi', '32.99', true, 'Main', ARRAY['Tuesday', 'Thursday', 'Saturday']);

-- Seed data for app_users
INSERT INTO public.app_users (id, type, company_id, first_name, last_name, email, membership_id, meals_per_week, status)
VALUES
    -- Company Admin for TechCorp
    ('55555555-6666-7777-8888-999999999999', 'super_admin', '11111111-2222-3333-4444-555555555555', 'John', 'Doe', 'john@techcorp.de', '33333333-4444-5555-6666-777777777777', 5, 'active'),
    -- Employee for TechCorp
    ('66666666-7777-8888-9999-aaaaaaaaaaaa', 'employee', '11111111-2222-3333-4444-555555555555', 'Jane', 'Smith', 'jane@techcorp.de', '33333333-4444-5555-6666-777777777777', 3, 'active'),
    -- Company Admin for MediaGroup
    ('77777777-8888-9999-aaaa-bbbbbbbbbbbb', 'company_admin', '22222222-3333-4444-5555-666666666666', 'Mike', 'Johnson', 'mike@mediagroup.de', '44444444-5555-6666-7777-888888888888', 5, 'active');

-- Seed data for allowed_restaurants
INSERT INTO public.allowed_restaurants (id, company_id, restaurant_id, distance_km)
VALUES
    ('88888888-9999-aaaa-bbbb-cccccccccccc', '11111111-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2.5),
    ('99999999-aaaa-bbbb-cccc-dddddddddddd', '11111111-2222-3333-4444-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1.8),
    ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '22222222-3333-4444-5555-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3.2); 