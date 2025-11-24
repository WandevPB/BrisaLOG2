// scripts/padroniza-valores-nf.js
// Script para padronizar valores de NF na base de dados (SQLite via Prisma)
// Converte valores como '2000' para '20,00' ou '2.000,00' conforme padrão brasileiro

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatValorNF(valor) {
    // Remove tudo que não é número
    let str = String(valor).replace(/\D/g, '');
    if (!str || str === '0') return '0,00';
    // Garante pelo menos 3 dígitos para centavos
    while (str.length < 3) str = '0' + str;
    let intPart = str.slice(0, str.length - 2);
    let decPart = str.slice(-2);
    // Adiciona separador de milhar
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return intPart + ',' + decPart;
}

async function padronizarNotasFiscais() {
    const nfs = await prisma.notaFiscal.findMany();
    let alterados = 0;
    for (const nf of nfs) {
        const valorOriginal = nf.valor;
        const valorPadronizado = formatValorNF(valorOriginal);
        if (valorOriginal !== valorPadronizado) {
            await prisma.notaFiscal.update({
                where: { id: nf.id },
                data: { valor: valorPadronizado }
            });
            alterados++;
            console.log(`NF ${nf.numero}: ${valorOriginal} -> ${valorPadronizado}`);
        }
    }
    console.log(`Padronização concluída. ${alterados} valores ajustados.`);
    await prisma.$disconnect();
}

padronizarNotasFiscais().catch(e => {
    console.error('Erro ao padronizar valores:', e);
    prisma.$disconnect();
});
