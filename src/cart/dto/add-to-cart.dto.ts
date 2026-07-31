export class CartItemDto {
  productId!: string;
  variantId!: string;
  sku!: string;
  name!: string;
  price!: number;
  quantity!: number;
  attributes?: Record<string, any>;
}

export class AddToCartDto {
  sessionId!: string; // Para usuarios anónimos o ID de usuario autenticado
  item!: CartItemDto;
}