/*
  Warnings:

  - You are about to drop the column `firma_url` on the `Empresa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Empresa" DROP COLUMN "firma_url";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "firma_url" TEXT;
