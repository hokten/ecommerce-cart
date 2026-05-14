import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('yeni bir ürün oluşturmalı', () => {
      const dto = { name: 'Laptop', price: 15000, stock: 10 };
      const product = service.create(dto);

      expect(product).toEqual({
        id: 1,
        name: 'Laptop',
        price: 15000,
        stock: 10,
      });
    });

    it('negatif fiyat ile hata fırlatmalı', () => {
      const dto = { name: 'Laptop', price: -100, stock: 10 };
      expect(() => service.create(dto)).toThrow(BadRequestException);
    });

    it('negatif stok ile hata fırlatmalı', () => {
      const dto = { name: 'Laptop', price: 100, stock: -5 };
      expect(() => service.create(dto)).toThrow(BadRequestException);
    });

    it('her ürüne benzersiz ID vermeli', () => {
      const p1 = service.create({ name: 'A', price: 10, stock: 1 });
      const p2 = service.create({ name: 'B', price: 20, stock: 2 });
      expect(p1.id).toBe(1);
      expect(p2.id).toBe(2);
    });
  });

  describe('findAll', () => {
    it('boş array döndürmeli', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('tüm ürünleri döndürmeli', () => {
      service.create({ name: 'A', price: 10, stock: 1 });
      service.create({ name: 'B', price: 20, stock: 2 });
      expect(service.findAll()).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('ID ile ürün bulmalı', () => {
      const created = service.create({ name: 'A', price: 10, stock: 1 });
      const found = service.findOne(created.id);
      expect(found).toEqual(created);
    });

    it('ürün bulunamazsa NotFoundException fırlatmalı', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });

  describe('decreaseStock', () => {
    it('stoğu doğru şekilde azaltmalı', () => {
      const product = service.create({ name: 'A', price: 10, stock: 10 });
      service.decreaseStock(product.id, 3);
      expect(service.findOne(product.id).stock).toBe(7);
    });

    it('yetersiz stokta hata fırlatmalı', () => {
      const product = service.create({ name: 'A', price: 10, stock: 5 });
      expect(() => service.decreaseStock(product.id, 10)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('ürünü silmeli', () => {
      const product = service.create({ name: 'A', price: 10, stock: 1 });
      service.remove(product.id);
      expect(service.findAll()).toHaveLength(0);
    });

    it('olmayan ürünü silmeye çalışınca hata fırlatmalı', () => {
      expect(() => service.remove(999)).toThrow(NotFoundException);
    });
  });
});