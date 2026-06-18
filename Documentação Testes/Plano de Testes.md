# Plano de Testes – Estacionamento Friendly

## Objetivo

Validar as funcionalidades do sistema Estacionamento Friendly, garantindo que os processos de entrada, saída, busca de veículos, cálculo de permanência, cobrança e persistência dos dados no Firebase Firestore funcionem conforme esperado.

---

# 1. Testes Funcionais

Objetivo: Validar o funcionamento das funcionalidades principais do sistema.

### Cenários

* CT001 – Cadastrar veículo com dados válidos.
* CT002 – Cadastrar veículo sem placa.
* CT003 – Cadastrar veículo sem modelo.
* CT004 – Cadastrar veículo sem cor.
* CT005 – Cadastrar veículo sem vaga.

### Resultado Esperado

O sistema deve permitir apenas cadastros válidos e exibir mensagens de erro para campos obrigatórios não preenchidos.

---

# 2. Testes de Regras de Negócio

Objetivo: Validar as regras definidas para o estacionamento.

### Cenários

* CT006 – Validar placa no padrão Mercosul (ABC1D23).
* CT007 – Validar placa no padrão antigo (ABC1234).
* CT008 – Validar placa inválida.
* CT009 – Impedir cadastro de veículo já estacionado.
* CT010 – Impedir utilização de vaga já ocupada.

### Resultado Esperado

O sistema deve aceitar apenas placas válidas e impedir inconsistências de negócio.

---

# 3. Testes de Busca

Objetivo: Validar a consulta de veículos cadastrados.

### Cenários

* CT011 – Buscar veículo existente.
* CT012 – Buscar veículo inexistente.

### Resultado Esperado

O sistema deve retornar os dados do veículo quando encontrado e informar quando não existir registro.

---

# 4. Testes de Saída

Objetivo: Validar o processo de saída dos veículos.

### Cenários

* CT013 – Registrar saída de veículo estacionado.
* CT014 – Registrar saída de veículo inexistente.

### Resultado Esperado

O sistema deve atualizar o status do veículo, calcular o valor devido e gerar recibo.

---

# 5. Testes de Cálculo

Objetivo: Validar as regras de cobrança do estacionamento.

### Cenários

* CT015 – Permanência inferior a 1 hora.
* CT016 – Permanência de 2 horas.
* CT017 – Permanência de 3 horas.

### Resultado Esperado

O valor cobrado deve ser calculado corretamente de acordo com a regra vigente.

---

# 6. Testes de Banco de Dados

Objetivo: Validar a persistência das informações no Firebase Firestore.

### Cenários

* CT018 – Validar gravação dos dados de entrada.
* CT019 – Validar atualização dos dados de saída.

### Campos Esperados

* placa
* modelo
* cor
* vaga
* status
* dataEntrada
* dataSaida
* valorCobrado
* tempoEstacionado

---

# 7. Testes Regressivos

Objetivo: Garantir que novas alterações não impactem funcionalidades já homologadas.

### Cenários

* RG001 – Entrada de veículo.
* RG002 – Saída de veículo.
* RG003 – Busca de veículo.
* RG004 – Validação de placa.
* RG005 – Validação de vaga ocupada.
* RG006 – Veículo duplicado.
* RG007 – Relatório diário.

### Resultado Esperado

Todas as funcionalidades homologadas devem continuar funcionando após novas implementações.

---

# 8. Testes Automatizados

Objetivo: Automatizar os principais fluxos do sistema utilizando Cypress.

### Cenários

* AUT001 – Cadastro de entrada válido.
* AUT002 – Veículo duplicado.
* AUT003 – Vaga ocupada.
* AUT004 – Busca de veículo.
* AUT005 – Saída de veículo.

### Resultado Esperado

Os testes automatizados devem executar sem falhas e validar os principais fluxos do sistema.

---

## Ferramentas Utilizadas

* JavaScript
* Firebase Firestore
* Cypress
* Google Chrome
* Visual Studio Code / Cursor

---

## Status do Projeto

Versão atual homologada após recuperação do ambiente Firebase, correção das permissões do Firestore e criação dos índices necessários para execução das consultas.
