import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
