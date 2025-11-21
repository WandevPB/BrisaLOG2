/**
 * Script de Limpeza de Modais
 * Garante que nenhum modal ficará travado na tela
 */

// Executa IMEDIATAMENTE ao carregar a página
(function() {
    'use strict';
    
    console.log('[Modal Cleanup] Executando limpeza de modais...');
    
    // Remove qualquer estado de modal do localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('modal') || key.includes('overlay'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Remove qualquer estado de modal do sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('modal') || key.includes('overlay'))) {
            sessionKeysToRemove.push(key);
        }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Função para fechar modais
    function closeAllModals() {
        // Busca por todos os elementos que podem ser modais
        const modalSelectors = [
            '[id*="modal"]',
            '[class*="modal"]',
            '[id*="overlay"]',
            '.fixed.inset-0',
            '.bg-opacity-50'
        ];
        
        modalSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    // Força o elemento a ficar escondido
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                    el.style.pointerEvents = 'none';
                    
                    // Adiciona classe hidden se existir
                    if (el.classList) {
                        el.classList.add('hidden');
                    }
                    
                    // Remove z-index alto
                    if (parseInt(el.style.zIndex) > 40) {
                        el.style.zIndex = '-1';
                    }
                });
            } catch (err) {
                // Ignora erros de seletor inválido
            }
        });
        
        // Garante que o body está rolável
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.overflow = '';
        
        console.log('[Modal Cleanup] Limpeza concluída');
    }
    
    // Executa quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', closeAllModals);
    } else {
        closeAllModals();
    }
    
    // Executa novamente após 100ms para garantir
    setTimeout(closeAllModals, 100);
    
    // Adiciona listener para ESC fechar qualquer modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeAllModals();
        }
    });
    
    // Expõe função global de emergência
    window.forceCloseAllModals = closeAllModals;
    
})();
