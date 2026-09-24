import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PermissionsDocument = Permissions & Document;

@Schema({ _id: false })
export class PermissionValues {
    @Prop({ type: Date })
    startDate?: Date;

    @Prop({ type: Date })
    endDate?: Date;

    @Prop({ type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ })
    startTime?: string;

    @Prop({ type: String, match: /^([01]\d|2[0-3]):([0-5]\d)$/ })
    endTime?: string;

    @Prop({ type: [Number], enum: [1, 2, 3, 4, 5, 6, 7], default: [] })
    daysOfWeek?: number[];

    @Prop({ type: String, default: "UTC" })
    timezone?: string;

    @Prop({ type: Boolean, default: true })
    isActive?: boolean;

    @Prop({ type: Number, min: 0 })
    maxUses?: number;

    @Prop({ type: Boolean, default: false })
    requiresApproval?: boolean;
}

export const PermissionValuesSchema = SchemaFactory.createForClass(PermissionValues);

@Schema({ timestamps: true })
export class Permissions {
    @Prop({ unique: true, required: true, trim: true })
    name!: string;

    @Prop({ type: PermissionValuesSchema })
    permission_values?: PermissionValues;
}

export const PermissionsSchema = SchemaFactory.createForClass(Permissions);