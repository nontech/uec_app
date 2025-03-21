-- Create revolut_credentials table
CREATE TABLE revolut_credentials (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_assertion text NOT NULL,
    access_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token text,
    refresh_token_expires_at timestamp with time zone,
    client_assertion_expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Create RLS policies
ALTER TABLE revolut_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow super_admin full access" ON revolut_credentials
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM app_users up
            WHERE up.id = auth.uid()
            AND up.type = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM app_users up
            WHERE up.id = auth.uid()
            AND up.type = 'super_admin'
        )
    );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_revolut_credentials_updated_at
    BEFORE UPDATE ON revolut_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 