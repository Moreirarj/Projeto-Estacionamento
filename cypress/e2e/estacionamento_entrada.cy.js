// Teste de Registro de Entrada de Veículo
describe('Registro de Entrada de Veículo', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('Deve permitir registrar a entrada de um veículo', () => {
        cy.get('#placaEntrada').type('ABC-1234'); // Digita a placa
        cy.get('#modeloEntrada').type('Fusca'); // Digita o modelo
        cy.get('#corEntrada').type('Preto'); // Digita a cor
        cy.contains('Registrar Entrada').click(); // Clica no botão

        // Verifica se o veículo foi adicionado na tabela
        cy.get('#tabela-veiculos').should('contain', 'ABC-1234');
        cy.get('#tabela-veiculos').should('contain', 'Fusca');
    });
});
