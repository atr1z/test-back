-- Production seed: Admin user
-- IMPORTANT: Change password after first login!
-- Default password: ChangeMe123!

INSERT INTO users (id, email, name, hashed_password, email_verified)
VALUES 
    (
        'user_admin_prod',
        'admin@yourdomain.com',
        'System Administrator',
        '$argon2id$v=19$m=19456,t=2,p=1$aM15713r3Xsvxbi31lqr1Q$iYZjDpHPPbQcXZo+d82bWvXC7AdYVxJVGGAz4sxKA4Q',
        true
    )
ON CONFLICT (email) DO NOTHING;
