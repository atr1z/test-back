import bcrypt from 'bcryptjs';

export class PasswordService {
    private saltRounds: number;

    constructor(saltRounds: number = 10) {
        this.saltRounds = saltRounds;
    }

    /**
     * Hash a password
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compare a password with a hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
