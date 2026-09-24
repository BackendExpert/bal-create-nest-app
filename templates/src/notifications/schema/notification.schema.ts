import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
    SYSTEM = 'SYSTEM',
    ACCOUNT = 'ACCOUNT',
    PAYMENT = 'PAYMENT',
    PLAN = 'PLAN',
    COURSE = 'COURSE',
    STUDENT = 'STUDENT',
    ACADEMIC = 'ACADEMIC',
    EXAM = 'EXAM',
    ASSIGNMENT = 'ASSIGNMENT',
    ATTENDANCE = 'ATTENDANCE',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    CLASSES = "CLASSES",
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    userId!: Types.ObjectId;

    @Prop({ required: true, enum: NotificationType })
    type!: NotificationType;

    @Prop({ required: true })
    title!: string;

    @Prop({ required: true })
    message!: string;

    @Prop({ default: false })
    isRead!: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    createdBy!: Types.ObjectId | null;

    @Prop({ type: Object, default: null })
    data!: Record<string, unknown> | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);