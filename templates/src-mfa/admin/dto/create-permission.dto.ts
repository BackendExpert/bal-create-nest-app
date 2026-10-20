import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CreatePermissionDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    startTime?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(7, { each: true })
    daysOfWeek?: number[];

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    endTime?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    maxUses?: number;

    @IsOptional()
    @IsBoolean()
    requiresApproval?: boolean;
}