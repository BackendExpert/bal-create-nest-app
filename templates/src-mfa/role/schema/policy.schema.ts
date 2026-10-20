
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PolicyDocument = HydratedDocument<Policy>;

export enum PolicyEffect {
    ALLOW = 'ALLOW',
    DENY = 'DENY',
}


export enum PolicyResourceType {
    UNIVERSITY = 'UNIVERSITY',
    FACULTY = 'FACULTY',
    DEPARTMENT = 'DEPARTMENT',
    PROGRAMME = 'PROGRAMME',
    BATCH = 'BATCH',
    MODULE = 'MODULE',
    CLASS = 'CLASS',
    EXAM = 'EXAM',
    ATTENDANCE = 'ATTENDANCE',
    RESOURCE = 'RESOURCE',
    LIBRARY = 'LIBRARY',
    CLUB = 'CLUB',
}

export enum PolicyScopeType {
    UNIVERSITY = 'UNIVERSITY',
    CAMPUS = 'CAMPUS',
    FACULTY = 'FACULTY',
    DEPARTMENT = 'DEPARTMENT',
    PROGRAMME = 'PROGRAMME',
    BATCH = 'BATCH',
    MODULE = 'MODULE',
    CLASS = 'CLASS',
    RESOURCE = 'RESOURCE',
}

export enum PolicyConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    IN = 'IN',
    NOT_IN = 'NOT_IN',
    GREATER_THAN = 'GREATER_THAN',
    GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
    LESS_THAN = 'LESS_THAN',
    LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
    EXISTS = 'EXISTS',
}

@Schema({ _id: false })
export class PolicyValues {
    @Prop({ type: Date, default: null })
    startDate!: Date | null;

    @Prop({ type: Date, default: null })
    endDate!: Date | null;

    @Prop({
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
        default: null,
    })
    startTime!: string | null;

    @Prop({
        type: String,
        match: /^([01]\d|2[0-3]):[0-5]\d$/,
        default: null,
    })
    endTime!: string | null;

    @Prop({
        type: [Number],
        enum: [0, 1, 2, 3, 4, 5, 6],
        default: [],
    })
    daysOfWeek!: number[];

    @Prop({ type: String, default: 'Asia/Colombo' })
    timezone!: string;
}

export const PolicyValuesSchema = SchemaFactory.createForClass(PolicyValues);

@Schema({ _id: false })
export class PolicyCondition {
    @Prop({ type: String, required: true, trim: true })
    attribute!: string;

    @Prop({
        type: String,
        enum: Object.values(PolicyConditionOperator),
        required: true,
    })
    operator!: PolicyConditionOperator;

    @Prop({ type: MongooseSchema.Types.Mixed, required: false })
    value?: unknown;
}

export const PolicyConditionSchema = SchemaFactory.createForClass(PolicyCondition);

@Schema({ timestamps: true })
export class Policy {
    @Prop({
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    })
    name!: string;

    @Prop({
        type: String,
        default: '',
        maxlength: 1000,
    })
    description!: string;

    @Prop({
        type: String,
        enum: Object.values(PolicyEffect),
        required: true,
    })
    effect!: PolicyEffect;


    @Prop({
        type: String,
        enum: Object.values(PolicyResourceType),
        required: true,
    })
    resourceType!: PolicyResourceType;

    @Prop({ type: Types.ObjectId, default: null })
    resourceID!: Types.ObjectId | null;

    @Prop({
        type: String,
        enum: Object.values(PolicyScopeType),
        required: true,
    })
    scopeType!: PolicyScopeType;

    @Prop({ type: Types.ObjectId, required: false, default: null })
    scopeID!: Types.ObjectId | null;

    @Prop({
        type: PolicyValuesSchema,
        required: true,
        default: () => ({}),
    })
    policyValues!: PolicyValues;

    @Prop({
        type: [PolicyConditionSchema],
        default: [],
    })
    conditions!: PolicyCondition[];

    @Prop({ type: Number, default: 100, min: 0 })
    priority!: number;

    @Prop({ type: Boolean, default: true, index: true })
    isActive!: boolean;

    @Prop({ type: Date, default: null })
    validFrom!: Date | null;

    @Prop({ type: Date, default: null })
    validUntil!: Date | null;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    createdBy!: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        default: null,
    })
    updatedBy!: Types.ObjectId | null;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);

PolicySchema.index({ resourceType: 1, resourceID: 1, isActive: 1 });
PolicySchema.index({ scopeType: 1, scopeID: 1, isActive: 1, });


// {
//   "name": "MSc Examination Access",
//   "description": "Allow eligible students to attempt the scheduled examination",
//   "permissionsID": "PERMISSION_OBJECT_ID",
//   "effect": "ALLOW",
//   "subjectType": "STUDENT",
//   "resourceType": "EXAM",
//   "scopeType": "MODULE",
//   "scopeID": "MODULE_OBJECT_ID",
//   "policyValues": {
//     "startDate": "2026-12-01T00:00:00.000Z",
//     "endDate": "2026-12-01T23:59:59.999Z",
//     "startTime": "09:00",
//     "endTime": "12:00",
//     "daysOfWeek": [2]
//   },
//   "priority": 10,
//   "isActive": true
// }