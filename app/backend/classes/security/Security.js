import bcrypt from 'bcrypt';


class Security {
    static async hashPassword(password) {
        const hash = await bcrypt.hash(password, 10);
        return hash;
    }
    static async comparePassword(password, hash) {
        const result = await bcrypt.compare(password, hash);
        return result;
    }
    static generateToken() {
        const token = Math.random().toString(36).substring(2, 15) + `-` + Math.random().toString(36).substring(2, 15) + `-` + Date.now();
        return token;
    }
}

export default Security;