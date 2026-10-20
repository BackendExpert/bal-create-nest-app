import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { EmailService } from "src/email/email.service";
import { Permissions, PermissionsDocument } from "src/role/schema/permissions.schema";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { AccountStatus, User, UserDocument } from "src/user/schema/user.schema";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { RegisterDto } from "./dto/register.dto";
import { Profile, ProfileDocument } from "src/profile/schema/profile.schema";
import { EmailVerification, EmailVerificationDocument } from "./schemas/email-verification.schema";
import { auditlogService } from "src/audit/auditlog.service";
import { AuditAction, AuditResult, AuditSeverity, } from "src/audit/schemas/audit-log.schema";
import { LoginDto } from "./dto/login.dto";
import { Session, SessionDocument } from "./schemas/session.schema";
import { PasswordReset, PasswordResetDocument } from "./schemas/password-reset.schema";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { generateSecret, generate, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { FraudGuard } from '../common/guard/fraud.gurad';


@Injectable()
export class AuthService {
    private readonly ENABLE_MFA = false;

    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(Permissions.name)
        private readonly permissionModel: Model<PermissionsDocument>,

        @InjectModel(Profile.name)
        private readonly profileModel: Model<ProfileDocument>,

        @InjectModel(EmailVerification.name)
        private readonly emailverificationModel: Model<EmailVerificationDocument>,

        @InjectModel(Session.name)
        private readonly sessionModel: Model<SessionDocument>,

        @InjectModel(PasswordReset.name)
        private readonly passwordresetModel: Model<PasswordResetDocument>,

        private readonly emailService: EmailService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly auditlogService: auditlogService,
        private readonly fraudGuard: FraudGuard,
    ) { }

    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12)
    }

    private async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    private genarteToken(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    private hashtoken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex')
    }

    private generateBackupCode(): string {
        return crypto.randomBytes(5).toString('hex').toUpperCase();
    }

    async generateMfaQRCode(email: string) {
        const secret = generateSecret();

        const otpauthUrl = `otpauth://totp/${encodeURIComponent(`MFA:${email}`)}?secret=${secret}&issuer=${encodeURIComponent('MFA')}&algorithm=SHA1&digits=6&period=30`;

        const qrCode = await QRCode.toDataURL(otpauthUrl);

        return {
            secret,
            qrCode,
        };
    }

    async Registation(
        dto: RegisterDto,
        deviceId: string,
        ipAddress: string,
        userAgent: string,
    ) {
        const email = dto.email.toLocaleLowerCase().trim();

        const existingUser = await this.userModel.findOne({ email: email });

        if (existingUser) {
            throw new ConflictException("Unable to create account, Already User in the System");
        }

        const role = await this.roleModel.findOne({ role: "GUEST" });

        if (!role) {
            throw new BadRequestException("Default role is not configured");
        }

        const passwordhash = await this.hashPassword(dto.password);

        const user = await this.userModel.create({
            email: email,
            passwordHash: passwordhash,
            roleId: role._id,
            accountStatus: AccountStatus.PENDING,
            emailVerified: false,
            mfaRequired: this.ENABLE_MFA,
            mfaEnabled: false,
        });

        const create_profile = await this.profileModel.create({
            userId: user._id,
            nic: `TEMP-${user._id.toString()}`
        });

        const token = this.genarteToken();

        await this.emailverificationModel.create({
            userId: user._id,
            tokenHash: this.hashtoken(token),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        const name = user.email
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

        await this.emailService.sendVerificationEmail(
            user.email,
            name,
            token,
        );

        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.EMAIL_VERIFICATION_REQUESTED,
            resource: "AUTH",
            resourceId: user._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: "Email verification message sent successfully",
            ipAddress,
            userAgent,
            metadata: {
                email: user.email,
                emailType: "verification",
                deviceId: deviceId ?? null,
                registrationIpAddress: ipAddress,
                registrationUserAgent: userAgent,
            },
        });

        return {
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: {
                email: user.email,
                mfaRequired: this.ENABLE_MFA,
                mfaEnabled: false
            },
        };
    }

    async VerifyEmail(
        token: string,
        ipAddress: string,
        userAgent: string,
    ) {
        const verification = await this.emailverificationModel.findOne({
            tokenHash: this.hashtoken(token),
            expiresAt: { $gt: new Date() },
        });

        if (!verification) {
            throw new UnauthorizedException('Invalid or expired verification token');
        }

        const user = await this.userModel.findById(verification.userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        user.emailVerified = true;
        user.accountStatus = AccountStatus.ACTIVE;

        let qrCode: string | null = null;
        let mfaSetupToken: string | null = null;

        if (this.ENABLE_MFA) {
            const { secret, qrCode: generatedQRCode } =
                await this.generateMfaQRCode(user.email);

            user.mfaSecret = secret;
            qrCode = generatedQRCode;

            mfaSetupToken = await this.jwtService.signAsync(
                {
                    sub: user._id.toString(),
                    purpose: 'MFA_SETUP',
                },
                {
                    expiresIn: '10m',
                },
            );
        }

        await user.save();

        await this.emailverificationModel.deleteOne({
            _id: verification._id,
        });

        return {
            success: true,
            message: 'Email verified successfully',
            email: user.email,
            emailVerified: user.emailVerified,
            mfaRequired: this.ENABLE_MFA,
            mfaEnabled: user.mfaEnabled,
            ...(this.ENABLE_MFA
                ? {
                    qrCode,
                    mfaSetupToken,
                }
                : {}),
        };
    }

    async verifyMfaSetup(
        mfaSetupToken: string,
        code: string,
        ipAddress: string,
        userAgent: string
    ) {
        let payload: { sub: string; purpose: string };

        try {
            payload = await this.jwtService.verifyAsync(mfaSetupToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired MFA setup token');
        }

        if (payload.purpose !== 'MFA_SETUP' || !payload.sub) {
            throw new UnauthorizedException('Invalid MFA setup token');
        }

        if (!Types.ObjectId.isValid(payload.sub)) {
            throw new UnauthorizedException('Invalid MFA setup token');
        }

        const user = await this.userModel
            .findById(payload.sub)
            .select('+mfaSecret');

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.emailVerified) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Email not verified during MFA setup',
                ipAddress,
                userAgent,
                metadata: {
                    mfaSetup: true,
                },
            });

            throw new UnauthorizedException('Please verify your email address first');
        }

        if (!user.mfaSecret) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'MFA setup has not been initiated',
                ipAddress,
                userAgent,
                metadata: {
                    mfaSetup: true,
                },
            });

            throw new BadRequestException('MFA setup has not been initiated');
        }

        if (user.mfaEnabled) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'MFA is already enabled',
                ipAddress,
                userAgent,
                metadata: {
                    mfaSetup: true,
                },
            });

            throw new BadRequestException('MFA is already enabled');
        }

        if (!/^\d{6}$/.test(code.trim())) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Invalid authenticator code format during MFA setup',
                ipAddress,
                userAgent,
                metadata: {
                    mfaSetup: true,
                },
            });

            throw new BadRequestException('Authenticator code must contain exactly 6 digits');
        }

        const result = await verify({
            secret: user.mfaSecret,
            token: code.trim(),
        });

        if (!result.valid) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Invalid authenticator code during MFA setup',
                ipAddress,
                userAgent,
                metadata: {
                    mfaSetup: true,
                },
            });

            throw new BadRequestException('Invalid authenticator code');
        }

        user.mfaEnabled = true;
        user.mfaEnabledAt = new Date();

        await user.save();

        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.LOGIN,
            resource: 'AUTH',
            resourceId: user._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: 'MFA enabled successfully',
            ipAddress,
            userAgent,
            metadata: {
                mfaSetup: true,
                mfaEnabled: true,
            },
        });

        return {
            success: true,
            message: 'MFA enabled successfully',
            data: {
                email: user.email,
                mfaRequired: user.mfaRequired,
                mfaEnabled: user.mfaEnabled,
            },
        };
    }


    async Login(
        dto: LoginDto,
        deviceId: string,
        ipAddress: string,
        userAgent: string,
    ) {
        const normalizedEmail = dto.email.toLowerCase().trim();

        const user = await this.userModel.findOne({ email: normalizedEmail }).select('+passwordHash +mfaSecret');

        if (!user) {
            await this.auditlogService.create({
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Invalid email or password',
                ipAddress,
                userAgent,
                metadata: {
                    email: normalizedEmail,
                    deviceId: deviceId ?? null,
                },
            });

            throw new BadRequestException('Invalid email or password');
        }

        if (!user.emailVerified) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.DENIED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Email address is not verified',
                ipAddress,
                userAgent,
                metadata: {
                    deviceId: deviceId ?? null,
                },
            });

            throw new BadRequestException('Please verify your email address first');
        }

        if (
            user.accountStatus === AccountStatus.LOCKED &&
            user.lockedUntil &&
            user.lockedUntil <= new Date()
        ) {
            user.accountStatus = AccountStatus.ACTIVE;
            user.lockedUntil = null;
            user.failedLoginAttempts = 0;

            await user.save();
        }

        if (
            user.accountStatus === AccountStatus.SUSPENDED ||
            user.accountStatus === AccountStatus.DISABLED ||
            user.accountStatus === AccountStatus.LOCKED
        ) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.DENIED,
                severity: AuditSeverity.HIGH,
                reason: `Account status: ${user.accountStatus}`,
                ipAddress,
                userAgent,
                metadata: {
                    deviceId: deviceId ?? null,
                },
            });

            throw new BadRequestException('Account is not available for login');
        }

        if (!user.passwordHash) {
            throw new BadRequestException('This account does not have a password. Please login with Google');
        }

        const passwordValid = await this.comparePassword(
            dto.password,
            user.passwordHash,
        );

        if (!passwordValid) {
            const failedAttempts = user.failedLoginAttempts + 1;
            const maxAttempts = 5;

            if (failedAttempts >= maxAttempts) {
                user.failedLoginAttempts = 0;
                user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                user.accountStatus = AccountStatus.LOCKED;

                await user.save();

                await this.auditlogService.create({
                    userId: user._id,
                    action: AuditAction.ACCOUNT_LOCKED,
                    resource: 'AUTH',
                    resourceId: user._id.toString(),
                    result: AuditResult.DENIED,
                    severity: AuditSeverity.HIGH,
                    reason: 'Maximum failed login attempts reached',
                    ipAddress,
                    userAgent,
                    metadata: {
                        failedAttempts,
                        lockDurationMinutes: 15,
                        deviceId: deviceId ?? null,
                    },
                });

                throw new BadRequestException('Too many failed login attempts. Account temporarily locked.');
            }

            user.failedLoginAttempts = failedAttempts;
            await user.save();

            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity:
                    failedAttempts >= 3
                        ? AuditSeverity.HIGH
                        : AuditSeverity.MEDIUM,
                reason: 'Invalid password',
                ipAddress,
                userAgent,
                metadata: {
                    failedAttempts,
                    deviceId: deviceId ?? null,
                },
            });

            throw new BadRequestException('Invalid email or password');
        }

        const fraudResult = await this.fraudGuard.evaluateLoginRisk(
            user._id,
            deviceId,
            ipAddress,
        );

        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.LOGIN,
            resource: 'AUTH',
            resourceId: user._id.toString(),
            result: fraudResult.requiresMfa
                ? AuditResult.DENIED
                : AuditResult.SUCCESS,
            severity: fraudResult.requiresMfa
                ? AuditSeverity.HIGH
                : AuditSeverity.LOW,
            reason: fraudResult.requiresMfa
                ? 'Additional MFA verification required due to login risk'
                : 'Password validated successfully',
            ipAddress,
            userAgent,
            metadata: {
                deviceId: deviceId ?? null,
                riskScore: fraudResult.riskScore,
                signals: fraudResult.signals,
                requiresMfa: fraudResult.requiresMfa,
            },
        });

        if (this.ENABLE_MFA && (user.mfaRequired || fraudResult.requiresMfa)) {
            if (!user.mfaEnabled || !user.mfaSecret) {
                throw new UnauthorizedException('Additional verification is required, but MFA is not configured. Please complete MFA setup.');
            }

            const mfaChallengeToken = await this.jwtService.signAsync(
                {
                    sub: user._id.toString(),
                    purpose: 'MFA_LOGIN',
                    deviceId: deviceId ?? null,
                    ipAddress,
                    userAgent,
                    riskScore: fraudResult.riskScore,
                },
                {
                    expiresIn: '5m',
                },
            );

            return {
                success: true,
                requiresMfa: true,
                message: 'Additional verification is required',
                mfaChallengeToken,
                riskScore: fraudResult.riskScore,
            };
        }

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.accountStatus = AccountStatus.ACTIVE;
        user.lastLoginAt = new Date();
        user.lastLoginIp = ipAddress;

        await user.save();

        const sessionId = new Types.ObjectId().toString();

        const rolename = await this.roleModel.findById(user.roleId);

        if (!rolename) {
            throw new NotFoundException('Role Cannot be Found');
        }

        const refreshToken = this.genarteToken();
        const refreshTokenHash = this.hashtoken(refreshToken);

        await this.sessionModel.create({
            _id: sessionId,
            userId: user._id,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            revokedAt: null,
            ipAddress,
            userAgent,
            deviceId: deviceId ?? null,
            isActive: true,
            lastUsedAt: new Date(),
        });

        const userData = {
            id: user._id,
            email: user.email,
            roleId: user.roleId,
            role: rolename.role,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
        };

        const accessToken = await this.jwtService.signAsync({
            sub: user._id.toString(),
            sessionId,
            user: userData,
        });

        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.LOGIN,
            resource: 'AUTH',
            resourceId: user._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: 'User logged in successfully',
            ipAddress,
            userAgent,
            sessionId,
            metadata: {
                deviceId: deviceId ?? null,
                riskScore: fraudResult.riskScore,
                signals: fraudResult.signals,
            },
        });

        const name = user.email
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        await this.emailService.sendWelcomeEmail(dto.email, name);

        return {
            success: true,
            message: 'Login Successful',
            accessToken,
            refreshToken,
        };
    }

    async verifyMfaLogin(
        mfaChallengeToken: string,
        code: string,
        deviceId: string,
        ipAddress: string,
        userAgent: string,
    ) {
        let payload: {
            sub: string;
            purpose: string;
            deviceId?: string | null;
            ipAddress?: string;
            userAgent?: string;
            riskScore?: number;
        };

        try {
            payload = await this.jwtService.verifyAsync(mfaChallengeToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired MFA challenge token');
        }

        if (
            payload.purpose !== 'MFA_LOGIN' ||
            !payload.sub ||
            !Types.ObjectId.isValid(payload.sub)
        ) {
            throw new UnauthorizedException('Invalid MFA challenge token');
        }

        if (
            (payload.deviceId ?? null) !== (deviceId ?? null) ||
            payload.ipAddress !== ipAddress ||
            payload.userAgent !== userAgent
        ) {
            throw new UnauthorizedException('Login details changed. Please log in again.');
        }

        if (!/^\d{6}$/.test(code.trim())) {
            throw new BadRequestException('A valid six-digit authenticator code is required');
        }

        const user = await this.userModel
            .findById(payload.sub)
            .select('+mfaSecret');

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.emailVerified || user.accountStatus !== AccountStatus.ACTIVE) {
            throw new UnauthorizedException('Your account is not active or verified');
        }

        if (!user.mfaEnabled || !user.mfaSecret) {
            throw new UnauthorizedException('MFA is not enabled for this account');
        }

        const mfaResult = await verify({
            secret: user.mfaSecret,
            token: code.trim(),
        });

        if (!mfaResult.valid) {
            await this.auditlogService.create({
                userId: user._id,
                action: AuditAction.LOGIN_FAILED,
                resource: 'AUTH',
                resourceId: user._id.toString(),
                result: AuditResult.FAILED,
                severity: AuditSeverity.MEDIUM,
                reason: 'Invalid authenticator code during MFA login',
                ipAddress,
                userAgent,
                metadata: {
                    mfaLogin: true,
                    deviceId: deviceId ?? null,
                },
            });

            throw new UnauthorizedException('Invalid authenticator code');
        }

        const rolename = await this.roleModel.findById(user.roleId);

        if (!rolename) {
            throw new NotFoundException('Role Cannot be Found');
        }

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.accountStatus = AccountStatus.ACTIVE;
        user.lastLoginAt = new Date();
        user.lastLoginIp = ipAddress;

        await user.save();

        const sessionId = new Types.ObjectId().toString();

        const refreshToken = this.genarteToken();
        const refreshTokenHash = this.hashtoken(refreshToken);

        await this.sessionModel.create({
            _id: sessionId,
            userId: user._id,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            revokedAt: null,
            ipAddress,
            userAgent,
            deviceId: deviceId ?? null,
            isActive: true,
            lastUsedAt: new Date(),
        });

        const userData = {
            id: user._id,
            email: user.email,
            roleId: user.roleId,
            role: rolename.role,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
        };

        const accessToken = await this.jwtService.signAsync({
            sub: user._id.toString(),
            sessionId,
            user: userData,
        });

        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.LOGIN,
            resource: 'AUTH',
            resourceId: user._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: 'User logged in successfully after MFA verification',
            ipAddress,
            userAgent,
            sessionId,
            metadata: {
                mfaLogin: true,
                deviceId: deviceId ?? null,
                riskScore: payload.riskScore,
            },
        });

        const name = user.email
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        await this.emailService.sendWelcomeEmail(user.email, name);

        return {
            success: true,
            message: 'Login Successful',
            accessToken,
            refreshToken,
        };
    }

    async refreshToken(
        refresh_Token: string
    ) {
        const refreshTokenHash = this.hashtoken(refresh_Token);

        const session = await this.sessionModel.findOne({
            refreshTokenHash: refreshTokenHash,
            isActive: true,
            revokedAt: null,
            expiresAt: {
                $gt: new Date(),
            },
        });

        if (!session) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        const user = await this.userModel.findById(session.userId);

        if (!user) {
            await this.sessionModel.updateOne(
                { _id: session._id },
                {
                    $set: {
                        isActive: false,
                        revokedAt: new Date(),
                    },
                }
            );

            throw new BadRequestException("Invalid or expired refresh token");
        }

        if (
            user.accountStatus === AccountStatus.SUSPENDED ||
            user.accountStatus === AccountStatus.DISABLED ||
            user.accountStatus === AccountStatus.LOCKED
        ) {
            await this.sessionModel.updateOne(
                { _id: session._id },
                {
                    $set: {
                        isActive: false,
                        revokedAt: new Date(),
                    },
                }
            );

            throw new BadRequestException("Account is not available");
        }

        const rolename = await this.roleModel.findById(user.roleId);

        if (!rolename) {
            throw new NotFoundException("Role Cannot be Found");
        }

        const newRefreshToken = this.genarteToken();
        const newRefreshTokenHash = this.hashtoken(newRefreshToken);

        session.refreshTokenHash = newRefreshTokenHash;
        session.lastUsedAt = new Date();

        await session.save();

        const userData = {
            id: user._id,
            email: user.email,
            roleId: user.roleId,
            role: rolename.role,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
        };

        const accessToken = await this.jwtService.signAsync({
            sub: user._id.toString(),
            sessionId: session._id.toString(),
            user: userData,
        });

        return {
            success: true,
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(
        token: string
    ) {
        const refreshTokenHash = this.hashtoken(token);

        const session = await this.sessionModel.findOne({
            refreshTokenHash,
            isActive: true,
            revokedAt: null,
        });

        if (!session) {
            throw new BadRequestException("Invalid session");
        }

        session.isActive = false;
        session.revokedAt = new Date();

        await session.save();

        await this.auditlogService.create({
            userId: session.userId,
            action: AuditAction.LOGOUT,
            resource: "AUTH",
            resourceId: session.userId.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: "User logged out successfully",
            sessionId: session._id.toString(),
        });

        return {
            success: true,
            message: "Logged out successfully",
        };
    }

    async forgetPassword(
        dto: ForgotPasswordDto,
        ipAddress: string,
        userAgent: string,
    ) {
        const useremail = dto.email.toLowerCase().trim()

        const targetUser = await this.userModel.findOne({
            email: useremail,

        })

        if (!targetUser) {
            throw new NotFoundException("User cannot be found")
        }

        const passresetToken = this.genarteToken();
        const hashpassresetToken = this.hashtoken(passresetToken)

        await this.passwordresetModel.deleteMany({
            userId: targetUser._id,
            usedAt: null,
        });

        await this.passwordresetModel.create({
            userId: targetUser._id,
            tokenHash: hashpassresetToken,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            usedAt: null,
        });

        const name = targetUser.email
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

        await this.emailService.sendPasswordResetEmail(
            targetUser.email,
            name,
            passresetToken,
        );

        await this.auditlogService.create({
            userId: targetUser._id,
            action: AuditAction.PASSWORD_RESET_REQUESTED,
            resource: "AUTH",
            resourceId: targetUser._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: "Password reset email sent successfully",
            ipAddress,
            userAgent,
            metadata: {
                email: targetUser.email,
                emailType: "password_reset",
            },
        });

        return {
            success: true,
            message: "Password reset email sent successfully",
        };
    }

    async resetPassword(
        token: string,
        dto: ResetPasswordDto,
        ipAddress: string,
        userAgent: string,
    ) {
        const tokenHash = this.hashtoken(token);

        const passwordReset = await this.passwordresetModel.findOne({
            tokenHash,
            usedAt: null,
            expiresAt: {
                $gt: new Date(),
            },
        });

        if (!passwordReset) {
            throw new BadRequestException("Invalid or expired password reset token");
        }

        const user = await this.userModel
            .findById(passwordReset.userId)
            .select("+passwordHash");

        if (!user) {
            throw new NotFoundException("User cannot be found");
        }

        const passwordHash = await this.hashPassword(
            dto.password,
        );

        user.passwordHash = passwordHash;
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.accountStatus = AccountStatus.ACTIVE;

        await user.save();

        passwordReset.usedAt = new Date();

        await passwordReset.save();

        await this.sessionModel.updateMany(
            {
                userId: user._id,
                isActive: true,
                revokedAt: null,
            },
            {
                $set: {
                    isActive: false,
                    revokedAt: new Date(),
                },
            },
        );


        await this.auditlogService.create({
            userId: user._id,
            action: AuditAction.PASSWORD_RESET_COMPLETED,
            resource: "AUTH",
            resourceId: user._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.MEDIUM,
            reason: "Password reset completed successfully",
            ipAddress,
            userAgent,
            metadata: {
                passwordReset: true,
            },
        });

        return {
            success: true,
            message: "Password reset successfully",
        };
    }
}