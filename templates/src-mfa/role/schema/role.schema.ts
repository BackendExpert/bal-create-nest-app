import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

export type RoleDocument = Role & Document

@Schema({ timestamps: true })
export class Role {
    @Prop({ unique: true, required: true })
    role!: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Permissions' }], default: [] })
    permissions!: Types.ObjectId[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);