describe('Registro de Saída de Veículo', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/');
    });

    it('Deve permitir registrar a saída de um veículo', () => {
        cy.get('#placa').type('ABC-1234');
        cy.get('#modelo').type('Fusca');
        cy.contains('Registrar Saída').click();

        // Espera o veículo ser adicionado antes de continuar
        cy.get('#tabela-veiculos').should('contain', 'Fusca');

        // Clica no botão "Registrar Saída"
        cy.contains('Registrar Saída').click({ force: true });


        // Verifica se o veículo foi removido
        cy.get('#tabela-veiculos').should('not.contain', 'Fusca');
    });
});
