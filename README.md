# SGHSS - Sistema de Gestao Hospitalar e Saude

Protótipo web front-end para autenticação, gestão de consultas e teleatendimento, com perfis de paciente, médico e administrador.

## Como executar

1. Abra a pasta do projeto no VS Code.
2. Inicie com Live Server a partir de `index.html`.
3. Acesse a URL local exibida (normalmente `http://localhost:5500`).

## Credenciais de acesso

- Paciente
  - Email: `paciente@sghss.com`
  - Senha: `123456`
- Medico
  - Email: `medico@sghss.com`
  - Senha: `123456`
- Administrador
  - Email: `admin@sghss.com`
  - Senha: `123456`

## Estrutura essencial

```text
project/
|-- index.html
|-- script.js
|-- style.css
`-- pages/
   |-- paciente.html
   |-- medico.html
   |-- admin.html
      `-- teleconsulta.html
```

## Funcionalidades principais

- Login por perfil (paciente, medico, admin)
- Cadastro rapido de paciente na tela inicial
- Agendamento de consulta com medico, data e motivo
- Cancelamento de consultas agendadas pelo paciente
- Controle de status da consulta
- Registro de evolucao clinica pelo medico ao encerrar consulta
- Acesso a teleconsulta
- Dashboards separados por perfil
- Painel admin com cadastro, filtros e exclusao de usuarios
- Persistencia de dados via localStorage

## Persistencia de dados (localStorage)

As chaves utilizadas no navegador incluem:

- `sghss_users`
- `sghss_current_user`
- `sghss_consultas`
- `sghss_teleconsulta_atual`

## Observacoes

- Stack: HTML, CSS, JavaScript (vanilla)
- Nao depende de backend para funcionamento local
- Recomenda-se executar via servidor local

## Publicacao e Repositorio (obrigatorio para entrega)

Links deste projeto:

- Repositorio GitHub: `https://github.com/RogerCastro25/sghss-projeto-multidisciplinar`
- Publicacao das paginas (HTTPS): `https://rogercastro25.github.io/sghss-projeto-multidisciplinar/`

Perfil GitHub do aluno:
- https://github.com/RogerCastro25

Contato do aluno:
- E-mail: rogeregaby2013@gmail.com

Modelo de links para este perfil:
- Repositorio GitHub: `https://github.com/RogerCastro25/NOME_DO_REPOSITORIO`
- Publicacao das paginas (HTTPS): `https://rogercastro25.github.io/NOME_DO_REPOSITORIO/`

### Como publicar no GitHub Pages

1. Crie o repositório no GitHub.
2. Envie os arquivos do projeto para a branch `main`.
3. No GitHub, abra `Settings` > `Pages`.
4. Em `Build and deployment`, selecione:
- `Source`: `Deploy from a branch`
- `Branch`: `main` e pasta `/ (root)`
5. Salve e aguarde a geração do link público HTTPS.

Observacao: depois de publicar, teste o link em aba anônima para garantir acesso sem login do GitHub.
