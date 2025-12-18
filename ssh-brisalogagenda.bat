@echo off
REM Script para conectar via SSH usando arquivo PEM
REM Altere o caminho do arquivo PEM se necessário

set PEM_PATH="C:\Users\wanderson.goncalves_\.ssh\brisalogagenda.pem"
set USER=ubuntu
set HOST=18.231.237.253

REM Comando SSH
ssh -i %PEM_PATH% %USER%@%HOST%
pause
