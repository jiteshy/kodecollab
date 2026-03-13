import { Module } from '@nestjs/common';
import { ValidationService } from '@kodecollab/shared';

@Module({
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
