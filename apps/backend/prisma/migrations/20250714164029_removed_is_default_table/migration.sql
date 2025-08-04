/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Category` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_isDefault_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isDefault";
