import { Global, Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Notification, NotificationSchema } from "./schema/notification.schema";
import { Role, RoleSchema } from "src/role/schema/role.schema";
import { User, UserSchema } from "src/user/schema/user.schema";
import { Permissions, PermissionsSchema } from "src/role/schema/permissions.schema";
import { PermissionGuard } from "src/common/guard/permission.guard";

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Permissions.name, schema: PermissionsSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: User.name, schema: UserSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
    ],
    controllers: [NotificationController],
    providers: [NotificationService, PermissionGuard],
    exports: [NotificationService]
})

export class NotificationModule { }