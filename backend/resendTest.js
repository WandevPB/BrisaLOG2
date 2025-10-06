// Endpoint simples para testar Resend direto
app.post('/api/test-resend/:email', async (req, res) => {
  console.log('📨 [RESEND TEST] Testando Resend direto...');
  const email = req.params.email;
  
  try {
    console.log('📨 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('📨 RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'PRESENTE' : 'AUSENTE');
    
    if (!process.env.RESEND_API_KEY) {
      return res.json({
        success: false,
        error: 'RESEND_API_KEY não encontrada'
      });
    }

    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'BrisaLOG <onboarding@resend.dev>',
      to: [email],
      subject: 'Teste Resend Railway',
      html: '<h1>Funciona!</h1><p>Email enviado via Resend + Railway</p>'
    });
    
    console.log('✅ [RESEND] Sucesso:', result);
    res.json({ 
      success: true, 
      messageId: result.data?.id || result.id,
      response: result
    });
    
  } catch (error) {
    console.error('❌ [RESEND] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = app;