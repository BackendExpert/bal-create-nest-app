import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { auditlogService } from "src/audit/auditlog.service";
import { AuditLog, AuditLogDocument, AuditAction, AuditResult, AuditSeverity } from "src/audit/schemas/audit-log.schema";
import { Profile, ProfileDocument } from "src/profile/schema/profile.schema";
import { Permissions, PermissionsDocument } from "src/role/schema/permissions.schema";
import { Role, RoleDocument } from "src/role/schema/role.schema";
import { AccountStatus, User, UserDocument } from "src/user/schema/user.schema";
import { CreateRoleDTO } from "./dto/create-role.dto";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDTO } from "./dto/update-permission.dto";
import { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,

        @InjectModel(Role.name)
        private readonly roleModel: Model<RoleDocument>,

        @InjectModel(Permissions.name)
        private readonly permissionsModel: Model<PermissionsDocument>,

        @InjectModel(Profile.name)
        private readonly profileModel: Model<ProfileDocument>,

        @InjectModel(AuditLog.name)
        private readonly auditlogModel: Model<AuditLogDocument>,

        private readonly auditlogService: auditlogService
    ) { }

    async CreateRole(
        dto: CreateRoleDTO
    ) {
        const name = dto.name.trim().toUpperCase();

        const existingRole = await this.roleModel.findOne({
            name,
        });

        if (existingRole) {
            throw new ConflictException('Role already exists');
        }

        const role = await this.roleModel.create({
            role: name,
            permissions: [],
        });

        return {
            success: true,
            message: 'Role created successfully',
            role,
        };
    }

    async CreatePermission(
        dto: CreatePermissionDto
    ) {
        const name = dto.name.trim().toUpperCase();

        const existingPermission = await this.permissionsModel.findOne({
            name,
        });

        if (existingPermission) {
            throw new ConflictException('Permission already exists');
        }

        const permission = await this.permissionsModel.create({
            name,
            permission_values: {
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                startTime: dto.startTime,
                endTime: dto.endTime,
                daysOfWeek: dto.daysOfWeek ?? [],
                timezone: dto.timezone ?? "UTC",
                isActive: dto.isActive ?? true,
                maxUses: dto.maxUses,
                requiresApproval: dto.requiresApproval ?? false,
            },
        });

        return {
            success: true,
            message: 'Permission created successfully',
            permission,
        };
    }

    async assignPermissionToRole(
        roleId: string,
        permissionId: string,
    ) {
        if (!Types.ObjectId.isValid(roleId)) {
            throw new NotFoundException('Invalid role ID');
        }

        if (!Types.ObjectId.isValid(permissionId)) {
            throw new NotFoundException('Invalid permission ID');
        }

        const role = await this.roleModel.findOne({
            _id: roleId,
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        const permission = await this.permissionsModel.findOne({
            _id: permissionId,
        });

        if (!permission) {
            throw new NotFoundException('Permission not found');
        }

        const alreadyAssigned = role.permissions.some(
            (id) => id.toString() === permissionId
        );

        if (alreadyAssigned) {
            throw new ConflictException('Permission already assigned to role');
        }

        role.permissions.push(permission._id);
        await role.save();

        return {
            success: true,
            message: 'Permission assigned to role successfully',
        };
    }

    async RemovePermission(
        roleId: string,
        permissionId: string,
    ) {
        if (!Types.ObjectId.isValid(roleId)) {
            throw new NotFoundException('Invalid role ID');
        }

        if (!Types.ObjectId.isValid(permissionId)) {
            throw new NotFoundException('Invalid permission ID');
        }

        const role = await this.roleModel.findOne({
            _id: roleId,
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        const permission = await this.permissionsModel.findOne({
            _id: permissionId,
        });

        if (!permission) {
            throw new NotFoundException('Permission not found');
        }

        const alreadyAssigned = role.permissions.some(
            (id) => id.toString() === permissionId
        );

        if (!alreadyAssigned) {
            throw new NotFoundException('Permission is not assigned to role');
        }

        role.permissions = role.permissions.filter(
            (id) => id.toString() !== permissionId
        );

        await role.save();

        return {
            success: true,
            message: 'Permission removed from role successfully',
        };
    }

    async FetchAllPermissions() {
        const permissions = await this.permissionsModel
            .find()
            .sort({
                name: 1,
            });

        return {
            success: true,
            result: permissions,
        };
    }

    async GetRoles() {
        const roles = await this.roleModel.find()

        return {
            success: true,
            result: roles
        }
    }

    async UpdatePermission(
        permissionId: string,
        dto: UpdatePermissionDTO,
    ) {
        if (!Types.ObjectId.isValid(permissionId)) {
            throw new NotFoundException('Invalid permission ID');
        }

        const updateData: any = {};

        if (dto.name !== undefined) {
            updateData.name = dto.name.trim().toUpperCase();
        }

        if (dto.startDate !== undefined) {
            updateData['permission_values.startDate'] = new Date(dto.startDate);
        }

        if (dto.endDate !== undefined) {
            updateData['permission_values.endDate'] = new Date(dto.endDate);
        }

        if (dto.startTime !== undefined) {
            updateData['permission_values.startTime'] = dto.startTime;
        }

        if (dto.endTime !== undefined) {
            updateData['permission_values.endTime'] = dto.endTime;
        }

        if (dto.daysOfWeek !== undefined) {
            updateData['permission_values.daysOfWeek'] = dto.daysOfWeek;
        }

        if (dto.timezone !== undefined) {
            updateData['permission_values.timezone'] = dto.timezone;
        }

        if (dto.isActive !== undefined) {
            updateData['permission_values.isActive'] = dto.isActive;
        }

        if (dto.maxUses !== undefined) {
            updateData['permission_values.maxUses'] = dto.maxUses;
        }

        if (dto.requiresApproval !== undefined) {
            updateData['permission_values.requiresApproval'] = dto.requiresApproval;
        }

        const permission = await this.permissionsModel.findByIdAndUpdate(
            permissionId,
            { $set: updateData },
            { new: true },
        );

        if (!permission) {
            throw new NotFoundException('Permission not found');
        }

        return {
            success: true,
            message: 'Permission updated successfully',
            permission,
        };
    }

    async FetchUsers() {
        const users = await this.userModel.find().populate('roleId')

        return {
            success: true,
            message: "All users Fetched Success",
            result: users
        }
    }

    async FetchUserByID(
        userId: string
    ) {
        const user = await this.userModel.findById(userId).populate('roleId').populate('institutionId')

        if (!user) {
            throw new NotFoundException("The User Cannot be found")
        }

        const profile = await this.profileModel.findOne({ userId: user._id })

        if (!profile) {
            throw new NotFoundException("The Profile Not Found by Currnt User")
        }

        const auditlog = await this.auditlogModel.find({ userId: user._id })

        return {
            success: true,
            message: "User Data Fetched Success",
            result: [
                user,
                profile,
                auditlog
            ]
        }
    }

    async UpdateUserRole(
        user: AuthenticatedUser,
        userId: string,
        role: string,
        ipAddress: string,
        location: any,
    ) {
        const targetUser = await this.userModel.findById(userId)

        if (!targetUser) {
            throw new NotFoundException("The Target User Cannot be found")
        }

        const rolecheck = await this.roleModel.findById(role)

        if (!rolecheck) {
            throw new NotFoundException("The Role cannot be found")
        }

        const update_user_role = await this.userModel.findByIdAndUpdate(
            userId,
            {
                roleId: rolecheck._id
            },
            { new: true }
        )

        await this.auditlogService.create({
            userId: user.id,
            action: AuditAction.UPDATE,
            resource: "PROFILE",
            resourceId: targetUser._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: `User Role Updated Success By ${user.email}`,
            ipAddress,
            metadata: {
                location,
            },
        });

        return {
            success: true,
            message: "User Role Updated Successfully"
        }
    }

    async FetchAuditlogs() {
        const auditlogs = await this.auditlogModel.find().populate('userId')

        return {
            success: true,
            message: "Audit Logs Fetched Success",
            result: auditlogs
        }
    }

    async FetchAuditlogbyID(
        auditlogID: string
    ) {
        const auditlog = await this.auditlogModel.findById(auditlogID).populate('userId')

        if (!auditlog) {
            throw new NotFoundException("The AuditLog Cannot be found")
        }

        return {
            success: true,
            message: "Auditlog Fetched Success",
            result: auditlog
        }
    }

    async UpdateUserStatus(
        user: AuthenticatedUser,
        userId: string,
        ipAddress: string,
        location: any,
    ) {
        const targetUser = await this.userModel.findById(userId)

        if (!targetUser) {
            throw new ConflictException("User Cannot be Found")
        }

        const updateuser = await this.userModel.findByIdAndUpdate(
            userId,
            {
                accountStatus: targetUser.accountStatus === AccountStatus.ACTIVE
                    ? AccountStatus.LOCKED
                    : AccountStatus.ACTIVE
            },
            { new: true }
        )

        await this.auditlogService.create({
            userId: user.id,
            action: AuditAction.UPDATE,
            resource: "PROFILE",
            resourceId: targetUser._id.toString(),
            result: AuditResult.SUCCESS,
            severity: AuditSeverity.LOW,
            reason: `User Stats Updated Success By ${user.email}`,
            ipAddress,
            metadata: {
                location,
            },
        });

        return {
            success: true,
            message: "User Stats Updated Successfully"
        }
    }

}