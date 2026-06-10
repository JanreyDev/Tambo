const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.documentTemplate.findMany({ where: { constituent_type: 'establishment' } });
  console.log("Establishment Templates Count:", t.length);
  const all = await prisma.documentTemplate.findMany();
  console.log("Total Templates Count:", all.length);
  
  // print types
  const types = await prisma.documentTemplate.groupBy({
    by: ['constituent_type'],
    _count: true
  });
  console.log(types);
}
main();
