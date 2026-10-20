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

export class PolicyValuesUpdateDto {
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

export class PolicyConditionUpdateDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    attribute?: string;

    @IsOptional()
    @IsEnum(PolicyConditionOperator)
    operator?: PolicyConditionOperator;

    @IsOptional()
    value?: unknown;
}

export class UpdatePolicyDto {
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsEnum(PolicyEffect)
    effect?: PolicyEffect;

    @IsOptional()
    @IsEnum(PolicyResourceType)
    resourceType?: PolicyResourceType;

    @IsOptional()
    @IsMongoId()
    resourceID?: string | null;

    @IsOptional()
    @IsEnum(PolicyScopeType)
    scopeType?: PolicyScopeType;

    @IsOptional()
    @IsMongoId()
    scopeID?: string | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => PolicyValuesUpdateDto)
    policyValues?: PolicyValuesUpdateDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PolicyConditionUpdateDto)
    conditions?: PolicyConditionUpdateDto[];

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