import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // 1. Usamos '!' para indicarle a TS que se inicializará en onModuleInit
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<number>('REDIS_PORT', 6379));
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;

    this.client = new Redis({
      host,
      port,
      password,
    });

    this.client.on('connect', () => {
      console.log('⚡ Conectado exitosamente a Redis desde CartService');
    });

    this.client.on('error', (err) => {
      console.error('❌ Error en la conexión con Redis:', err);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }
}