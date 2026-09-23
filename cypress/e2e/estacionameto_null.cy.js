describe('Validação de Formulário', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('Não deve permitir registrar entrada sem preencher os campos', () => {
        cy.contains('Registrar Entrada').click();
        cy.on('window:alert', (txt) => {
            expect(txt).to.contains('Preencha todos os campos!');
        });
    });
});
