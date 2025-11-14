import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AppGateway } from './gateway/gateway.gateway';
import { GatewayController } from './gateway/gateway.controller';
import { GatewayService } from './gateway/gateway.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout (increased for database operations)
      maxRedirects: 5,
    }),
  ],
  controllers: [GatewayController],
  providers: [AppGateway, GatewayService],
})
export class ApiGatewayModule {}
