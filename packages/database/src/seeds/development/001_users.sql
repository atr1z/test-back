-- Development seed: Test users
-- Password for all test users: test123456
-- Hash generated with Argon2id

INSERT INTO users (id, email, name, hashed_password, email_verified)
VALUES 
    (
        'user_test_001',
        'test@mextrack.com',
        'Test User',
        '$argon2id$v=19$m=19456,t=2,p=1$aM15713r3Xsvxbi31lqr1Q$iYZjDpHPPbQcXZo+d82bWvXC7AdYVxJVGGAz4sxKA4Q',
        true
    ),
    (
        'user_admin_001',
        'admin@mextrack.com',
        'Admin User',
        '$argon2id$v=19$m=19456,t=2,p=1$aM15713r3Xsvxbi31lqr1Q$iYZjDpHPPbQcXZo+d82bWvXC7AdYVxJVGGAz4sxKA4Q',
        true
    )
ON CONFLICT (email) DO NOTHING;
