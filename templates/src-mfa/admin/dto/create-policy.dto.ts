import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsMongoId,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import {
    PolicyConditionOperator,
    PolicyEffect,
    PolicyResourceType,
    PolicyScopeType,
} from '../../role/schema/policy.schema';

export class PolicyValuesDto {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date | null;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date | null;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    startTime?: string | null;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    endTime?: string | null;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    daysOfWeek?: number[];

    @IsOptional()
    @IsString()
    timezone?: string;
}

export class PolicyConditionDto {
    @IsString()
    @MaxLength(150)
    attribute!: string;

    @IsEnum(PolicyConditionOperator)
    operator!: PolicyConditionOperator;

    @IsOptional()
    value?: unknown;
}

export class PolicyCreateDto {
    @IsString()
    @MaxLength(150)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsEnum(PolicyEffect)
    effect!: PolicyEffect;

    @IsEnum(PolicyResourceType)
    resourceType!: PolicyResourceType;

    @IsOptional()
    @IsMongoId()
    resourceID?: string | null;

    @IsEnum(PolicyScopeType)
    scopeType!: PolicyScopeType;

    @IsOptional()
    @IsMongoId()
    scopeID?: string | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => PolicyValuesDto)
    policyValues?: PolicyValuesDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PolicyConditionDto)
    conditions?: PolicyConditionDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    priority?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validFrom?: Date | null;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    validUntil?: Date | null;
}