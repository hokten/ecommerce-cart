import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';

describe('CartService', () => {
  let service: CartService;
  let productsService: ProductsService;

  // ProductsService'in sahte (mock) versiyonu
  const mockProductsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addItem', () => {
    it('sepete ürün eklemeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });

      const cart = service.addItem({ productId: 1, quantity: 2 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].subtotal).toBe(30000);
      expect(cart.total).toBe(30000);
      expect(productsService.findOne).toHaveBeenCalledWith(1);
    });

    it('aynı ürün eklenirse miktarı arttırmalı', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.addItem({ productId: 1, quantity: 3 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.total).toBe(75000);
    });

    it('stok yetersizse hata fırlatmalı', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 2,
      });

      expect(() =>
        service.addItem({ productId: 1, quantity: 5 }),
      ).toThrow(BadRequestException);
    });

    it('miktar 0 veya negatifse hata fırlatmalı', () => {
      expect(() =>
        service.addItem({ productId: 1, quantity: 0 }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.addItem({ productId: 1, quantity: -1 }),
      ).toThrow(BadRequestException);
    });

    it('ürün yoksa ProductsService hatasını yansıtmalı', () => {
      mockProductsService.findOne.mockImplementation(() => {
        throw new NotFoundException();
      });

      expect(() =>
        service.addItem({ productId: 999, quantity: 1 }),
      ).toThrow(NotFoundException);
    });
  });

  describe('getCart', () => {
    it('boş sepet döndürmeli', () => {
      const cart = service.getCart();
      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });

    it('toplam fiyatı doğru hesaplamalı', () => {
      mockProductsService.findOne
        .mockReturnValueOnce({ id: 1, name: 'A', price: 100, stock: 10 })
        .mockReturnValueOnce({ id: 2, name: 'B', price: 50, stock: 10 });

      service.addItem({ productId: 1, quantity: 2 }); // 200
      service.addItem({ productId: 2, quantity: 3 }); // 150

      const cart = service.getCart();
      expect(cart.total).toBe(350);
    });
  });

  describe('removeItem', () => {
    it('sepetten ürün silmeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1, name: 'A', price: 100, stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.removeItem(1);

      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('sepette olmayan ürünü silmeye çalışınca hata fırlatmalı', () => {
      expect(() => service.removeItem(999)).toThrow(BadRequestException);
    });
  });

  describe('clearCart', () => {
    it('sepeti temizlemeli', () => {
      mockProductsService.findOne.mockReturnValue({
        id: 1, name: 'A', price: 100, stock: 10,
      });

      service.addItem({ productId: 1, quantity: 2 });
      const cart = service.clearCart();

      expect(cart.items).toEqual([]);
      expect(cart.total).toBe(0);
    });
  });
});