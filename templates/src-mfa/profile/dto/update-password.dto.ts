import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class UpdatePasswordDTO {
    @IsString()
    @IsNotEmpty()
    currnt_password!: string

    @IsString()
    @IsStrongPassword()
    @IsNotEmpty()
    new_password!: string
}