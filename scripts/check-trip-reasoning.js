const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const trips = await p.trip.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        demoMode: true,
        parseReasoning: true,
        generateReasoning: true,
        updatedAt: true,
      },
    });
    console.log(JSON.stringify(trips, null, 2));
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

