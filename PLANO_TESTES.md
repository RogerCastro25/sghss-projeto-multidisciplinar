# Plano de Testes - SGHSS (Enfase Front-end)

## Escopo
Validar o fluxo funcional do prototipo Front-end do SGHSS com foco em login, consultas e teleatendimento.

## Ambiente
- Navegador: Chrome/Edge (versao atual)
- Resolucao: desktop e mobile (responsivo)
- Persistencia: localStorage

## Casos de Teste Funcionais
1. Login paciente
- Entrada: paciente@sghss.com / 123456 / paciente
- Esperado: redirecionar para dashboard do paciente

2. Login medico
- Entrada: medico@sghss.com / 123456 / medico
- Esperado: redirecionar para dashboard do medico

3. Login admin
- Entrada: admin@sghss.com / 123456 / admin
- Esperado: redirecionar para dashboard admin

4. Login invalido
- Entrada: credenciais incorretas
- Esperado: alerta de erro + toast

5. Cadastro rapido de paciente
- Acao: preencher nome/email/senha no cadastro da tela inicial
- Esperado: paciente criado no localStorage e dados preenchidos no login

6. Agendar consulta (paciente)
- Acao: preencher data/motivo e enviar
- Esperado: consulta criada com status agendada

7. Cancelar consulta (paciente)
- Acao: cancelar consulta ativa
- Esperado: status alterado para cancelada

8. Confirmar/iniciar/encerrar (medico)
- Acao: usar botoes de status
- Esperado: transicao correta entre status e evolucao obrigatoria no encerramento

9. Teleatendimento
- Acao: abrir sala por botao rapido ou tabela
- Esperado: carregar dados da consulta e permitir inicio/encerramento

10. Modal de confirmacao de encerramento
- Acao: clicar em encerrar consulta
- Esperado: solicitar confirmacao antes de efetivar

11. Historico encerrado
- Acao: encerrar consulta
- Esperado: aparecer no historico de paciente e medico com evolucao clinica

12. Cadastro de usuario pelo admin
- Acao: cadastrar paciente ou medico no painel admin
- Esperado: usuario aparecer na tabela e no total

13. Exclusao de usuario pelo admin
- Acao: excluir usuario comum (nao admin)
- Esperado: usuario removido e consultas vinculadas removidas apos confirmacao

## Casos de Teste Nao Funcionais
1. Responsividade
- Esperado: layout adaptado em telas pequenas

2. Usabilidade
- Esperado: feedback visual claro (toasts e status)

3. Performance local
- Esperado: respostas imediatas em acao de UI

## Registro de Evidencias
- Print 1: Login
- Print 2: Dashboard paciente
- Print 3: Dashboard medico
- Print 4: Sala de teleatendimento
- Print 5: Historicos

## Resultado Final
- [ ] Aprovado
- [ ] Requer ajustes
