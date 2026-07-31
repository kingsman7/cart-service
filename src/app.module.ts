import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

import { CartService } from './cart/cart.service';
import { CartController } from './cart/cart.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class AppModule {}