import { prisma } from "../../config/prisma.js";

export const createPassDb = async (passData, tx = prisma) => {
  const result = await tx.pass.create({
    data: passData,
  });

  await tx.passTimeline.create({
    data: {
      passId: result.id,
      action: "created",
      actorId: passData.studentId,
      actorRole: "student",
      remarks: "Pass request submitted.",
    }
  });

  return result;
};
