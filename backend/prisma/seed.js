const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { key: 'ENTRADA', label: 'Entradas' },
    { key: 'PRINCIPAL', label: 'Pratos Principais' },
    { key: 'BEBIDA', label: 'Bebidas' },
    { key: 'SOBREMESA', label: 'Sobremesas' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { key: category.key },
      update: { label: category.label },
      create: category
    });
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const categoryMap = {};
    const categoryRows = await prisma.category.findMany();
    categoryRows.forEach((category) => {
      categoryMap[category.key] = category.id;
    });

    const products = [
      {
        name: 'Bruschetta Clássica',
        description: 'Pão crocante com tomate fresco, manjericão e azeite aromático.',
        price: 28.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.ENTRADA
      },
      {
        name: 'Bolinho de Arroz',
        description: 'Porção crocante de bolinhos de arroz com molho especial da casa.',
        price: 24.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.ENTRADA
      },
      {
        name: 'Salada Caprese',
        description: 'Tomate, muçarela e manjericão com redução de balsâmico.',
        price: 32.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.ENTRADA
      },
      {
        name: 'Risoto de Cogumelos',
        description: 'Risoto cremoso com mix de cogumelos e parmesão ralado.',
        price: 52.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.PRINCIPAL
      },
      {
        name: 'Filé Mignon ao Molho',
        description: 'Filé ao ponto servido com purê de batatas e legumes grelhados.',
        price: 68.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.PRINCIPAL
      },
      {
        name: 'Lasanha da Casa',
        description: 'Lasanha com molho especial e queijo gratinado.',
        price: 45.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.PRINCIPAL
      },
      {
        name: 'Suco Natural',
        description: 'Suco de laranja ou limão fresco, feito na hora.',
        price: 16.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.BEBIDA
      },
      {
        name: 'Cerveja Artesanal',
        description: 'Cerveja gelada escolhida entre nossas opções especiais.',
        price: 18.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.BEBIDA
      },
      {
        name: 'Vinho da Casa',
        description: 'Taça de vinho tinto selecionado pelo sommelier.',
        price: 34.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.BEBIDA
      },
      {
        name: 'Pudim Cremoso',
        description: 'Pudim tradicional com calda de caramelo.',
        price: 20.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.SOBREMESA
      },
      {
        name: 'Cheesecake de Frutas',
        description: 'Cheesecake leve com geleia de frutas vermelhas.',
        price: 26.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.SOBREMESA
      },
      {
        name: 'Brownie Quente',
        description: 'Brownie com sorvete de creme e calda de chocolate.',
        price: 22.0,
        imageUrl: '',
        available: true,
        categoryId: categoryMap.SOBREMESA
      }
    ];

    for (const product of products) {
      await prisma.product.create({ data: product });
    }
  }
}

main()
  .then(() => {
    console.log('Seed finalizado');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
