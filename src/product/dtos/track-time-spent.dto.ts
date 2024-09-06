import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class TrackTimeSpentDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsNumber()
  @IsNotEmpty()
  timeSpend: number;
}
