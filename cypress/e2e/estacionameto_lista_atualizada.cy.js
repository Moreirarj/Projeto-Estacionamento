describe('Persistência de Dados', () => {
    beforeEach(() => {
        cy.visit('http://127.0.0.1:5500/');
    });

    it('Deve manter os veículos cadastrados após recarregar a página', () => {
        cy.get('#placa').type('LMN-9876');
        cy.get('#modelo').type('Corolla');
        cy.contains('Registrar Entrada').click();

        cy.get('#tabela-veiculos').should('contain', 'LMN-9876');

       // Aguarde um pouco para garantir que o Firestore processou a gravação
     cy.wait(1000);

     cy.reload();


        // Verifica se o veículo foi adicionado
        cy.get('#tabela-veiculos').should('contain', 'LMN-9876');

        // Recarrega a página
        cy.reload();

        // Verifica se o veículo ainda está listado
        cy.get('#tabela-veiculos').should('contain', 'LMN-9876');
    });
});
