import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types, Schema as MongooseSchema } from "mongoose";

export type PermissionsDocument = Permissions & Document;

@Schema({ timestamps: true })
export class Permissions {
    @Prop({ unique: true, required: true, trim: true })
    name!: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Policy' }], default: [], })
    policyids!: Types.ObjectId[];
}

export const PermissionsSchema = SchemaFactory.createForClass(Permissions);