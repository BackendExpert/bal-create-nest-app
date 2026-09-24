import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/role/schema/role.schema';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuditLog, AuditLogSchema } from 'src/audit/schemas/audit-log.schema';
import { auditlogService } from 'src/audit/auditlog.service';
import { EmailService } from 'src/email/email.service';
import { Profile, ProfileSchema } from './schema/profile.schema';
import { NotificationService } from 'src/notifications/notification.service';
import { Notification, NotificationSchema } from 'src/notifications/schema/notification.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Permissions, PermissionsSchema } from 'src/role/schema/permissions.schema';
import { PermissionGuard } from 'src/common/guard/permission.guard';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Role.name, schema: RoleSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: Profile.name, schema: ProfileSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: Permissions.name, schema: PermissionsSchema },
        ])
    ],
    controllers: [ProfileController,],
    providers: [ProfileService, auditlogService, EmailService, NotificationService, PermissionGuard],
    exports: [ProfileService],
})
export class ProfileModule { }