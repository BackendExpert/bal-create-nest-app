import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Permissions, PermissionsDocument } from "src/role/schema/permissions.schema";
import { Policy, PolicyDocument, PolicyEffect } from "src/role/schema/policy.schema";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { ABAC_PERMISSION_KEY } from "../decorators/abac.decorator";


@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectModel(Permissions.name)
        private readonly permissionModel: Model<PermissionsDocument>,

        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(Policy.name)
        private readonly policyModel: Model<PolicyDocument>,
    ) { }

    private getLocalDateParts(date: Date, timezone: string) {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).formatToParts(date);

        const values = Object.fromEntries(
            parts.map((part) => [part.type, part.value]),
        );

        const weekdays: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        };

        return {
            year: Number(values.year),
            month: Number(values.month),
            day: Number(values.day),
            weekday: weekdays[values.weekday],
            minutes: Number(values.hour) * 60 + Number(values.minute),
        };
    }

    private isPolicyApplicable(
        policy: PolicyDocument,
        role: RoleDocument,
        now: Date,
    ): boolean {
        if (!policy.isActive) {
            return false;
        }

        if (policy.validFrom && now.getTime() < new Date(policy.validFrom).getTime()) {
            return false;
        }

        if (policy.validUntil && now.getTime() > new Date(policy.validUntil).getTime()) {
            return false;
        }

        const policyData = policy as unknown as {
            policyValues?: {
                startDate?: Date | string | null;
                endDate?: Date | string | null;
                startTime?: string | null;
                endTime?: string | null;
                daysOfWeek?: number[];
                timezone?: string;
            };
        };

        const values = policyData.policyValues;

        if (!values) {
            return true;
        }

        const timezone = values.timezone || "Asia/Colombo";
        const localNow = this.getLocalDateParts(now, timezone);

        if (values.startDate) {
            const start = this.getLocalDateParts(new Date(values.startDate), timezone);

            if (
                localNow.year < start.year ||
                (localNow.year === start.year && localNow.month < start.month) ||
                (localNow.year === start.year && localNow.month === start.month && localNow.day < start.day)
            ) {
                return false;
            }
        }

        if (values.endDate) {
            const end = this.getLocalDateParts(new Date(values.endDate), timezone);

            if (
                localNow.year > end.year ||
                (localNow.year === end.year && localNow.month > end.month) ||
                (localNow.year === end.year && localNow.month === end.month && localNow.day > end.day)
            ) {
                return false;
            }
        }

        if (values.daysOfWeek?.length && !values.daysOfWeek.includes(localNow.weekday)) {
            return false;
        }

        if (values.startTime || values.endTime) {
            const currentMinutes = localNow.minutes;

            const startMinutes = values.startTime
                ? Number(values.startTime.split(":")[0]) * 60 + Number(values.startTime.split(":")[1])
                : 0;

            const endMinutes = values.endTime
                ? Number(values.endTime.split(":")[0]) * 60 + Number(values.endTime.split(":")[1])
                : 1439;

            if (startMinutes <= endMinutes) {
                if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
                    return false;
                }
            } else {
                if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
                    return false;
                }
            }
        }

        return true;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<string>(
            ABAC_PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as Record<string, unknown> | undefined;

        if (!user) {
            throw new UnauthorizedException("Authentication required");
        }

        if (
            typeof user.role === "string" &&
            user.role.toUpperCase() === "SUPER_ADMIN"
        ) {
            return true;
        }

        const roleId = user.roleId;

        if (!roleId || !Types.ObjectId.isValid(String(roleId))) {
            throw new ForbiddenException("User role not found");
        }

        const role = await this.roleModel.findById(roleId).populate({
            path: "permissions",
            model: this.permissionModel,
            populate: {
                path: "policyids",
                model: this.policyModel,
            },
        });

        if (!role) {
            throw new ForbiddenException("Role not found");
        }

        const permissions = (role as unknown as { permissions: PermissionsDocument[] }).permissions ?? [];

        const permission = permissions.find(
            (item) => item.name === requiredPermission,
        );

        if (!permission) {
            throw new ForbiddenException("Permission denied");
        }

        const assignedPolicies = (
            (permission.policyids ?? []) as unknown as PolicyDocument[]
        ).filter((policy) => policy.isActive);

        if (assignedPolicies.length === 0) {
            throw new ForbiddenException("No active policy assigned to this permission");
        }

        const now = new Date();

        const applicablePolicies = assignedPolicies
            .filter((policy) => this.isPolicyApplicable(policy, role, now))
            .sort((a, b) => a.priority - b.priority);

        if (applicablePolicies.length === 0) {
            throw new ForbiddenException("No applicable policy found");
        }

        const winningPolicy = applicablePolicies[0];

        if (winningPolicy.effect === PolicyEffect.DENY) {
            throw new ForbiddenException("Access denied by policy");
        }

        if (winningPolicy.effect !== PolicyEffect.ALLOW) {
            throw new ForbiddenException("No policy allows this action");
        }

        request.permission = permission;
        request.policies = applicablePolicies;
        request.policy = winningPolicy;

        return true;
    }
}