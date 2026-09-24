import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { Role, RoleSchema } from "src/role/schema/role.schema";
import { User, UserSchema } from "src/user/schema/user.schema";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { Profile, ProfileSchema } from "src/profile/schema/profile.schema";
import { Session, SessionSchema } from "./schemas/session.schema";
import { EmailVerification, EmailVerificationSchema } from "./schemas/email-verification.schema";
import { PasswordReset, PasswordResetSchema } from "./schemas/password-reset.schema";
import { Permissions, PermissionsSchema } from "src/role/schema/permissions.schema";
import { PassportModule } from "@nestjs/passport";
import { EmailService } from "src/email/email.service";
import { auditlogService } from "src/audit/auditlog.service";
import { AuditLogModule } from "src/audit/auditlog.module";

@Module({
    imports: [
        ConfigModule,
        PassportModule,
        AuditLogModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '15m'}
            })
        }),

        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Role.name, schema: RoleSchema },
            { name: Profile.name, schema: ProfileSchema },
            { name: Session.name, schema: SessionSchema },
            { name: EmailVerification.name, schema: EmailVerificationSchema },
            { name: PasswordReset.name, schema: PasswordResetSchema }, 
            { name: Permissions.name, schema: PermissionsSchema },
        ])
    ],

    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, EmailService],
    exports: [JwtModule, AuthService]
})

export class AuthModule { }