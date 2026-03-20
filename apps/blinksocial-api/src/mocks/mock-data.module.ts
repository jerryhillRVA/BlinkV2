import { Module } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Module({
  providers: [
    {
      provide: 'MOCK_DATA_SERVICE',
      useFactory: () => {
        if (process.env['NODE_ENV'] === 'production') return null;
        return new MockDataService();
      },
    },
  ],
  exports: ['MOCK_DATA_SERVICE'],
})
export class MockDataModule {}
