import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Role, RoleDocument } from "./schema/role.schema";
import { Permissions, PermissionsDocument } from "./schema/permissions.schema";
import { Model } from "mongoose";

Permissions

@Injectable()
export class RoleService {
    constructor(
        @InjectModel(Role.name)
        private roleModel: Model<RoleDocument>,
    ) { }

    async GetPermissions(roleName: string): Promise<PermissionsDocument[]> {
        const roleDoc = await this.roleModel
            .findOne({ role: roleName })
            .populate<{ permissions: PermissionsDocument[] }>('permissions');

        return roleDoc?.permissions || [];
    }
}