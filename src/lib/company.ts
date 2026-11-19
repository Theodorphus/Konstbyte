// Who runs Konstbyte. Required on the site by the Swedish e-commerce act
// (lagen om elektronisk handel, 8 §): name, registration number, address, email.
export const COMPANY = {
  name: 'Webbdev Studio',
  orgNr: '950721-6498',
  address: 'Västra Gunnesgärde 41, Göteborg',
  email: 'webbdevstudio@gmail.com',
} as const;

/** "Webbdev Studio (org.nr 950721-6498), Västra Gunnesgärde 41, Göteborg" */
export const COMPANY_LINE = `${COMPANY.name} (org.nr ${COMPANY.orgNr}), ${COMPANY.address}`;
