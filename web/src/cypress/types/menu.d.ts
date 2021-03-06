declare namespace Cypress {
  interface Chainable<Subject> {
    /** Open the selected menu and click the matching item. */
    menu: menuFn
  }
}

type menuFn = (label: string, options?: MenuSelectOptions) => Cypress.Chainable
