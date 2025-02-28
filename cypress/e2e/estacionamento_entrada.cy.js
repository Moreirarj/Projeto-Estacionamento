// Teste de Registro de Entrada de Veículo
describe('Registro de Entrada de Veículo', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/');
    });

    it('Deve permitir registrar a entrada de um veículo', () => {
        cy.get('#placa').type('ABC-1234'); // Digita a placa
        cy.get('#modelo').type('Fusca'); // Digita o modelo
        cy.contains('Registrar Entrada').click(); // Clica no botão

        // Verifica se o veículo foi adicionado na tabela
        cy.get('#tabela-veiculos').should('contain', 'ABC-1234');
        cy.get('#tabela-veiculos').should('contain', 'Fusca');
    });
});
