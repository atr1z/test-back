/**
 * Example: Database Usage with Repository and Model Pattern
 *
 * This example shows how to use the database integration
 * with repositories, models, and the DatabaseService.
 */

import { createDatabasePool } from '../database';
import { DatabaseService } from '../service/database';
import { UserRepository } from './user-repository';
import { User } from './user-model';
import Redis from 'ioredis';

/**
 * Example: Basic database setup and usage
 */
export async function basicDatabaseExample() {
    console.log('=== Basic Database Example ===');

    // 1. Create database pools
    const coreDb = createDatabasePool({
        connectionString:
            process.env['CORE_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_core',
    });

    const trackingDb = createDatabasePool({
        connectionString:
            process.env['TRACKING_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_tracking',
    });

    // 2. Test connections
    console.log('Testing database connections...');
    const coreConnected = await coreDb.query('SELECT NOW()');
    const trackingConnected = await trackingDb.query('SELECT NOW()');

    console.log('✓ Core database connected:', coreConnected.rows[0]);
    console.log('✓ Tracking database connected:', trackingConnected.rows[0]);

    // 3. Create repository
    const userRepo = new UserRepository(coreDb);

    // 4. Create a user
    console.log('\nCreating user...');
    const newUser = await userRepo.createUser({
        email: 'john@example.com',
        name: 'John Doe',
        passwordHash: 'hashed_password_123',
        role: 'user',
    });
    console.log('✓ User created:', newUser.toJSON());

    // 5. Find user by email
    console.log('\nFinding user by email...');
    const foundUser = await userRepo.findByEmail('john@example.com');
    console.log('✓ User found:', foundUser?.toJSON());

    // 6. Update user
    console.log('\nUpdating user...');
    const updatedUser = await userRepo.updateUser(newUser.id!, {
        name: 'John Smith',
        role: 'manager',
    });
    console.log('✓ User updated:', updatedUser?.toJSON());

    // 7. Get user statistics
    console.log('\nGetting user statistics...');
    const stats = await userRepo.getUserStats();
    console.log('✓ User stats:', stats);

    // 8. Clean up
    await coreDb.close();
    await trackingDb.close();
    console.log('\n✓ Database connections closed');
}

/**
 * Example: Using DatabaseService for multiple databases
 */
export async function databaseServiceExample() {
    console.log('\n=== DatabaseService Example ===');

    // 1. Get DatabaseService instance
    const dbService = DatabaseService.getInstance();

    // 2. Register databases
    dbService.registerDatabase('core', {
        connectionString:
            process.env['CORE_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_core',
    });

    dbService.registerDatabase('tracking', {
        connectionString:
            process.env['TRACKING_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_tracking',
    });

    // 3. Test all connections
    console.log('Testing all database connections...');
    const healthStatus = await dbService.healthCheck();
    console.log('✓ Health status:', healthStatus);

    // 4. Get database statistics
    console.log('\nDatabase statistics:');
    const stats = dbService.getStats();
    console.log('✓ Stats:', stats);

    // 5. Use repositories with different databases
    const coreDb = dbService.getDatabase('core');

    const userRepo = new UserRepository(coreDb);
    const users = await userRepo.findAll();
    console.log(`✓ Found ${users.length} users in core database`);

    // 6. Clean up
    await dbService.closeAll();
    console.log('✓ All database connections closed');
}

/**
 * Example: Repository with cache
 */
export async function repositoryWithCacheExample() {
    console.log('\n=== Repository with Cache Example ===');

    // 1. Setup Redis (optional)
    const redis = new Redis(
        process.env['REDIS_URL'] || 'redis://localhost:6379'
    );

    // 2. Create database pool
    const coreDb = createDatabasePool({
        connectionString:
            process.env['CORE_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_core',
    });

    // 3. Create repository with cache
    const userRepo = new UserRepository(coreDb, redis);

    // 4. Test source health
    console.log('Checking source health...');
    const healthStatus = await userRepo.getHealthStatus();
    console.log('✓ Source health:', healthStatus);

    // 5. Create a user (will be cached)
    console.log('\nCreating user (will be cached)...');
    const user = await userRepo.createUser({
        email: 'jane@example.com',
        name: 'Jane Doe',
        passwordHash: 'hashed_password_456',
        role: 'admin',
    });
    console.log('✓ User created:', user.toJSON());

    // 6. Find user (should come from cache on second call)
    console.log('\nFinding user (first call - from DB)...');
    const start1 = Date.now();
    const foundUser1 = await userRepo.findById(user.id!);
    const time1 = Date.now() - start1;
    console.log(`✓ User found in ${time1}ms:`, foundUser1?.toJSON());

    console.log('\nFinding user (second call - from cache)...');
    const start2 = Date.now();
    const foundUser2 = await userRepo.findById(user.id!);
    const time2 = Date.now() - start2;
    console.log(`✓ User found in ${time2}ms:`, foundUser2?.toJSON());

    console.log(`✓ Cache speedup: ${time1}ms -> ${time2}ms`);

    // 7. Clean up
    await coreDb.close();
    await redis.quit();
    console.log('\n✓ Database and Redis connections closed');
}

/**
 * Example: Model validation and lifecycle hooks
 */
export async function modelExample() {
    console.log('\n=== Model Example ===');

    // 1. Create user with validation
    console.log('Creating user with validation...');
    const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        role: 'user',
    });

    // 2. Validate user
    const isValid = await user.isValid();
    console.log(`✓ User is valid: ${isValid}`);

    if (!isValid) {
        const errors = await user.getValidationErrors();
        console.log('✗ Validation errors:', errors);
        return;
    }

    // 3. Test model methods
    console.log('\nTesting model methods...');
    console.log('✓ Display name:', user.getDisplayName());
    console.log('✓ Is admin:', user.isAdmin());
    console.log('✓ Is active:', user.isUserActive());

    // 4. Update user
    console.log('\nUpdating user...');
    await user.updateLastLogin();
    console.log('✓ Last login updated:', user.lastLoginAt);

    // 5. Serialize user (excludes sensitive data)
    console.log('\nSerializing user...');
    const json = user.toJSON();
    console.log('✓ User JSON (no password):', json);

    // 6. Clone user
    console.log('\nCloning user...');
    const clonedUser = user.clone();
    console.log('✓ User cloned:', clonedUser.toJSON());

    // 7. Test validation errors
    console.log('\nTesting validation errors...');
    const invalidUser = new User({
        email: 'invalid-email',
        name: 'A', // Too short
        passwordHash: '',
        role: 'invalid-role',
    });

    const invalidIsValid = await invalidUser.isValid();
    console.log(`✓ Invalid user is valid: ${invalidIsValid}`);

    if (!invalidIsValid) {
        const errors = await invalidUser.getValidationErrors();
        console.log('✓ Validation errors:', errors);
    }
}

/**
 * Example: Transaction usage
 */
export async function transactionExample() {
    console.log('\n=== Transaction Example ===');

    const coreDb = createDatabasePool({
        connectionString:
            process.env['CORE_DATABASE_URL'] ||
            'postgresql://user:pass@localhost:5432/atriz_core',
    });

    const userRepo = new UserRepository(coreDb);

    try {
        // 1. Create multiple users in a transaction
        console.log('Creating multiple users in transaction...');
        const result = await userRepo.withTransaction(async repo => {
            const user1 = await repo.createUser({
                email: 'user1@example.com',
                name: 'User One',
                passwordHash: 'hash1',
                role: 'user',
            });

            const user2 = await repo.createUser({
                email: 'user2@example.com',
                name: 'User Two',
                passwordHash: 'hash2',
                role: 'user',
            });

            return { user1, user2 };
        });

        console.log('✓ Transaction completed:', {
            user1: result.user1.toJSON(),
            user2: result.user2.toJSON(),
        });
    } catch (error) {
        console.error('✗ Transaction failed:', error);
    } finally {
        await coreDb.close();
        console.log('✓ Database connection closed');
    }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    try {
        await basicDatabaseExample();
        await databaseServiceExample();
        await repositoryWithCacheExample();
        await modelExample();
        await transactionExample();

        console.log('\n🎉 All examples completed successfully!');
    } catch (error) {
        console.error('❌ Example failed:', error);
        process.exit(1);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
}
