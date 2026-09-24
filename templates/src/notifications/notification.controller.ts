import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { ParseObjectIdPipe } from "src/common/pipes/parse-object-id.pipe";
import { JwtAuthGuard } from "src/common/guard/jwt-auth.guard";
import { Permission, PermissionGuard } from "src/common/guard/permission.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";

@Controller('api/v1/notifications')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService
    ) { }

    @Get('/fetch-notifications')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission("FETCH_NOTIFICATIONS")
    async fetchNotifications (
        @CurrentUser() user: AuthenticatedUser
    ) {
        return this.notificationService.FetchNotifications(user)
    }

    @Patch('/read-notifications/:id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @Permission("READ_NOTIFICATIONS")
    async ReadNotfications (
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseObjectIdPipe) notificationID: string
    ) {
        return this.notificationService.ReadNotification(user, notificationID)
    }
}
