import { randomBytes } from 'crypto';

export const generateRandomPassword = (length = 12): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const bytes = randomBytes(length);

    return Array.from(bytes, (byte) => characters[byte % characters.length]).join('');
};