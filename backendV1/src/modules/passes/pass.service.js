import { prisma } from "../../config/prisma.js";

export const createPassDb = async (passData, tx = prisma) => {
  const result = await tx.pass.create({
    data: passData,
  });
  return result;
};
