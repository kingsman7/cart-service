import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AddToCartDto, CartItemDto } from './dto/add-to-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

const CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días de vida útil

@Injectable()
export class CartService {
  constructor(private readonly redisService: RedisService) {}

  private getCartKey(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  async addToCart(addToCartDto: AddToCartDto) {
    const { sessionId, item } = addToCartDto;
    const key = this.getCartKey(sessionId);
    const redis = this.redisService.getClient();

    // Obtener carrito actual
    const existingCartRaw = await redis.get(key);
    let items: CartItemDto[] = existingCartRaw ? JSON.parse(existingCartRaw) : [];

    // Verificar si el ítem (variante) ya está en el carrito
    const existingItemIndex = items.findIndex((i) => i.variantId === item.variantId);

    if (existingItemIndex > -1) {
      items[existingItemIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    // Guardar en Redis con expiración renovada
    await redis.set(key, JSON.stringify(items), 'EX', CART_TTL_SECONDS);

    return { sessionId, items, totalItems: items.reduce((acc, i) => acc + i.quantity, 0) };
  }

  async getCart(sessionId: string) {
    const key = this.getCartKey(sessionId);
    const redis = this.redisService.getClient();
    const cartRaw = await redis.get(key);

    const items: CartItemDto[] = cartRaw ? JSON.parse(cartRaw) : [];
    const totalPrice = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    return {
      sessionId,
      items,
      totalItems: items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice,
    };
  }

  async clearCart(sessionId: string) {
    const key = this.getCartKey(sessionId);
    await this.redisService.getClient().del(key);
    return { message: 'Carrito vaciado exitosamente' };
  }

  async mergeCart(mergeCartDto: MergeCartDto) {
    const { guestSessionId, userId } = mergeCartDto;
    const redis = this.redisService.getClient();

    const guestKey = this.getCartKey(guestSessionId);
    const userKey = this.getCartKey(userId);

    // 1. Obtener ambos carritos en paralelo desde Redis
    const [guestCartRaw, userCartRaw] = await Promise.all([
      redis.get(guestKey),
      redis.get(userKey),
    ]);

    const guestItems: CartItemDto[] = guestCartRaw ? JSON.parse(guestCartRaw) : [];
    const userItems: CartItemDto[] = userCartRaw ? JSON.parse(userCartRaw) : [];

    if (guestItems.length === 0) {
      // Si el carrito de invitado estaba vacío, solo devolvemos el del usuario
      return this.getCart(userId);
    }

    // 2. Fusionar los ítems
    const mergedMap = new Map<string, CartItemDto>();

    // Cargar ítems existentes del usuario
    for (const item of userItems) {
      mergedMap.set(item.variantId, { ...item });
    }

    // Combinar o agregar ítems del invitado
    for (const item of guestItems) {
      if (mergedMap.has(item.variantId)) {
        const existing = mergedMap.get(item.variantId)!;
        existing.quantity += item.quantity; // Sumar cantidades
      } else {
        mergedMap.set(item.variantId, { ...item });
      }
    }

    const mergedItems = Array.from(mergedMap.values());

    // 3. Guardar el carrito unificado bajo la clave del userId
    await redis.set(userKey, JSON.stringify(mergedItems), 'EX', CART_TTL_SECONDS);

    // 4. Eliminar el carrito temporal del invitado
    await redis.del(guestKey);

    return {
      userId,
      items: mergedItems,
      totalItems: mergedItems.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: mergedItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
    };
  }
}