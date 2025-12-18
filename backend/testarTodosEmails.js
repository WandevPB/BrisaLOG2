// Script para testar todos os templates de email
// Envia todos os tipos de email para wandevpb@gmail.com

// Carregar variáveis de ambiente
require('dotenv').config();

const emailService = require('./emailService');

const EMAIL_TESTE = 'wandevpb@gmail.com';

async function enviarTodosEmails() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     📧 TESTE DE TODOS OS TEMPLATES DE EMAIL - BrisaLOG   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📬 Destinatário: ${EMAIL_TESTE}`);
    console.log('');

    const resultados = [];

    // 1. EMAIL DE BOAS-VINDAS
    try {
        console.log('📤 [1/10] Enviando: Boas-Vindas...');
        const result = await emailService.sendBoasVindasUsuario({
            to: EMAIL_TESTE,
            nome: 'Wanderson Davyd',
            codigo: 'WD2025',
            cdNome: 'CD Pernambuco'
        });
        resultados.push({ email: 'Boas-Vindas', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Boas-Vindas', success: false });
    }

    // 2. EMAIL DE CONFIRMADO
    try {
        console.log('📤 [2/10] Enviando: Agendamento Confirmado...');
        const result = await emailService.sendConfirmadoEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            cdNome: 'Lagoa Nova',
            motoristaNome: 'João da Silva',
            veiculoPlaca: 'ABC-1234',
            dataAgendamento: '2025-12-20',
            horarioAgendamento: '14:00'
        });
        resultados.push({ email: 'Confirmado', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Confirmado', success: false });
    }

    // 3. EMAIL DE ENTREGUE
    try {
        console.log('📤 [3/10] Enviando: Entrega Realizada...');
        const result = await emailService.sendEntregueEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            cdNome: 'CD Bahia',
            motoristaNome: 'João da Silva',
            veiculoPlaca: 'ABC-1234',
            dataEntrega: '2025-12-20',
            horarioEntrega: '15:30'
        });
        resultados.push({ email: 'Entregue', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Entregue', success: false });
    }

    // 4. EMAIL DE NÃO VEIO
    try {
        console.log('📤 [4/10] Enviando: Não Compareceu...');
        const result = await emailService.sendNaoVeioEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            cdNome: 'CD Pernambuco',
            motoristaNome: 'João da Silva',
            veiculoPlaca: 'ABC-1234',
            dataAgendamento: '2025-12-20',
            horarioAgendamento: '10:00'
        });
        resultados.push({ email: 'Não Veio', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Não Veio', success: false });
    }

    // 5. EMAIL DE REAGENDAMENTO
    try {
        console.log('📤 [5/10] Enviando: Solicitação de Reagendamento...');
        const result = await emailService.sendReagendamentoEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            cdNome: 'CD Pereiro (Estoque de frotas)',
            dataOriginal: '2025-12-20',
            novaDataSugerida: '2025-12-22',
            novoHorario: '09:00',
            motivo: 'Lotação do CD na data original',
            motoristaNome: 'João da Silva',
            veiculoPlaca: 'ABC-1234'
        });
        resultados.push({ email: 'Reagendamento', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Reagendamento', success: false });
    }

    // 6. EMAIL DE RESPOSTA REAGENDAMENTO (ACEITO)
    try {
        console.log('📤 [6/10] Enviando: Resposta Reagendamento (Aceito)...');
        const result = await emailService.sendRespostaReagendamentoEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            resposta: 'aceito',
            novaData: '2025-12-22',
            novoHorario: '09:00',
            comentario: 'Data confirmada, estaremos presentes no horário marcado.'
        });
        resultados.push({ email: 'Resposta Reagendamento (Aceito)', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Resposta Reagendamento (Aceito)', success: false });
    }

    // 7. EMAIL DE RESPOSTA REAGENDAMENTO (RECUSADO)
    try {
        console.log('📤 [7/10] Enviando: Resposta Reagendamento (Recusado)...');
        const result = await emailService.sendRespostaReagendamentoEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD789012',
            resposta: 'recusado',
            novaData: '2025-12-25',
            novoHorario: '11:00',
            comentario: 'Não conseguiremos atender nesta data.'
        });
        resultados.push({ email: 'Resposta Reagendamento (Recusado)', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Resposta Reagendamento (Recusado)', success: false });
    }

    // 8. EMAIL DE CANCELAMENTO
    try {
        console.log('📤 [8/10] Enviando: Agendamento Cancelado...');
        const result = await emailService.sendCanceladoFornecedorEmail({
            to: EMAIL_TESTE,
            fornecedorNome: 'Transportadora Exemplo LTDA',
            agendamentoCodigo: 'AGD123456',
            motivo: 'Cancelado a pedido do fornecedor por problemas operacionais'
        });
        resultados.push({ email: 'Cancelado', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Cancelado', success: false });
    }

    // 9. EMAIL DE RECUPERAÇÃO CADASTRADA
    try {
        console.log('📤 [9/10] Enviando: E-mail de Recuperação Cadastrado...');
        const result = await emailService.sendRecuperacaoCadastradaEmail({
            to: EMAIL_TESTE,
            nome: 'Wanderson Davyd',
            cd: 'CD Lagoa Nova'
        });
        resultados.push({ email: 'Recuperação Cadastrada', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Recuperação Cadastrada', success: false });
    }

    // 10. EMAIL DE RECUPERAÇÃO DE SENHA
    try {
        console.log('📤 [10/10] Enviando: Recuperação de Senha...');
        const result = await emailService.sendPasswordResetEmail(
            EMAIL_TESTE,
            'TOKEN123456789ABCDEF',
            'Wanderson Davyd'
        );
        resultados.push({ email: 'Recuperação de Senha', success: result.success });
        console.log(result.success ? '✅ Enviado com sucesso!' : `❌ Erro: ${result.error}`);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        resultados.push({ email: 'Recuperação de Senha', success: false });
    }

    // RESUMO FINAL
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    📊 RESUMO DO ENVIO                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    const sucessos = resultados.filter(r => r.success).length;
    const falhas = resultados.filter(r => !r.success).length;

    resultados.forEach((r, index) => {
        const status = r.success ? '✅' : '❌';
        console.log(`${status} [${index + 1}] ${r.email}`);
    });

    console.log('');
    console.log(`✅ Sucessos: ${sucessos}/${resultados.length}`);
    console.log(`❌ Falhas: ${falhas}/${resultados.length}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📧 Verifique sua caixa de entrada: ${EMAIL_TESTE}`);
    console.log('═══════════════════════════════════════════════════════════');
}

// Executar
enviarTodosEmails()
    .then(() => {
        console.log('');
        console.log('✅ Processo finalizado!');
        process.exit(0);
    })
    .catch(error => {
        console.error('');
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
