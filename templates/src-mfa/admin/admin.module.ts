import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Role, RoleSchema } from 'src/role/schema/role.schema';
import { Profile, ProfileSchema } from 'src/profile/schema/profile.schema';
import { AuditLog, AuditLogSchema } from 'src/audit/schemas/audit-log.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Permissions, PermissionsSchema } from 'src/role/schema/permissions.schema';
import { auditlogService } from 'src/audit/auditlog.service';
import { Policy, PolicySchema } from 'src/role/schema/policy.schema';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Role.name, schema: RoleSchema, },
            { name: Permissions.name, schema: PermissionsSchema, },
            { name: User.name, schema: UserSchema },
            { name: Profile.name, schema: ProfileSchema },
            { name: AuditLog.name, schema: AuditLogSchema },
            { name: Policy.name, schema: PolicySchema },
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService, auditlogService ],
    exports: [AdminService],
})
export class AdminModule { }