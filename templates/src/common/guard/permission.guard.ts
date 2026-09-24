import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString } from 'mongoose';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { Role, RoleDocument } from '../../role/schema/role.schema';
import {
    Permissions,
    PermissionsDocument,
    PermissionValues,
} from '../../role/schema/permissions.schema';

export const PERMISSION_KEY = 'required_permission';
// Kept with the guard to avoid adding a separate decorator file.
export const Permission = (name: string) => SetMetadata(PERMISSION_KEY, name);

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,
        @InjectModel(Permissions.name)
        private readonly permissionModel: Model<PermissionsDocument>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const { user } = context.switchToHttp().getRequest<{
            user?: AuthenticatedUser;
        }>();

        if (!user) {
            throw new UnauthorizedException('Authentication is required');
        }

        if (user.role === 'SUPER_ADMIN') {
            return true;
        }

        const requiredPermission = this.reflector.getAllAndOverride<string>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermission || !isObjectIdOrHexString(user.roleId)) {
            throw new ForbiddenException('Permission denied');
        }

        const role = await this.roleModel.findById(user.roleId)
            .select('permissions').lean().exec();

        if (!role?.permissions?.length) {
            throw new ForbiddenException('Permission denied');
        }

        const permission = await this.permissionModel.findOne({
            _id: { $in: role.permissions },
            name: requiredPermission,
        }).select('permission_values').lean().exec();

        if (!permission || !this.isAllowed(permission.permission_values, new Date())) {
            throw new ForbiddenException('Permission denied');
        }

        return true;
    }

    private isAllowed(values: PermissionValues | undefined, now: Date): boolean {
        if (!values) return true;
        if (values.isActive === false) return false;

        // There is no approval record or persistent usage counter in this system.
        // Fail closed for these restrictions until those workflows are available.
        if (values.requiresApproval || values.maxUses != null) return false;

        const timestamp = now.getTime();
        if (values.startDate != null) {
            const start = new Date(values.startDate).getTime();
            if (!Number.isFinite(start) || timestamp < start) return false;
        }
        if (values.endDate != null) {
            const end = new Date(values.endDate).getTime();
            if (!Number.isFinite(end) || timestamp > end) return false;
        }

        let parts: Intl.DateTimeFormatPart[];
        try {
            parts = new Intl.DateTimeFormat('en-US', {
                timeZone: values.timezone ?? 'UTC',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
            }).formatToParts(now);
        } catch {
            return false;
        }

        const part = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((item) => item.type === type)?.value;
        // ISO weekdays: Monday = 1, Sunday = 7; [] allows every day.
        const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            .indexOf(part('weekday') ?? '') + 1;
        if (values.daysOfWeek?.length && !values.daysOfWeek.includes(weekday)) {
            return false;
        }

        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
        const { startTime, endTime } = values;
        if ((startTime != null && !timePattern.test(startTime)) ||
            (endTime != null && !timePattern.test(endTime))) {
            return false;
        }

        const currentTime = `${part('hour')}:${part('minute')}`;
        // Overnight windows include both sides of midnight. Weekdays refer to
        // the current local calendar day; time boundaries include the full minute.
        if (startTime != null && endTime != null && startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }

        return (startTime == null || currentTime >= startTime) &&
            (endTime == null || currentTime <= endTime);
    }
}
