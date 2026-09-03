-- Comptes client + catalogue multi-prestations pour L'Espace de Rayan.

-- AlterTable: services — categorie + reservable en ligne
ALTER TABLE "services" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'HOMME';
ALTER TABLE "services" ADD COLUMN "bookableOnline" BOOLEAN NOT NULL DEFAULT true;

-- Nom unique (cle naturelle pour l'amorcage du catalogue)
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- Index d'affichage par categorie
CREATE INDEX "services_category_sortOrder_idx" ON "services"("category", "sortOrder");

-- CreateTable: customers (comptes client)
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Unicite de l'e-mail
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- AlterTable: appointments — rattachement au compte client
ALTER TABLE "appointments" ADD COLUMN "customerId" TEXT;

-- Index sur le rattachement
CREATE INDEX "appointments_customerId_idx" ON "appointments"("customerId");

-- Cle etrangere vers customers
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
