// Single source of truth for the company's legal registration details.
// Used by the Mentions Légales / Legal Notice page and required by CMI for
// online-payment onboarding. Leave a value as '' when it is not yet known —
// every consumer hides empty fields gracefully (do not invent figures).

export const COMPANY_NAME = 'Sunset Agafay SARL'
export const LEGAL_FORM = 'SARL'
export const RC = '125993' // Registre du Commerce
export const ICE = '003038453000004' // Identifiant Commun de l'Entreprise
export const CAPITAL = '100 000 MAD'
export const REGISTRATION_DATE = '01/06/2022' // Immatriculation
export const HQ_ADDRESS =
  'Lot Chaabat Ssi Laroussi, Douar Lamlih, Commune et Caïdat Agafay, Cercle Loudaya, Marrakech, Maroc'
export const MANAGER = 'Abdelhakim Imharken' // Gérant

// Not yet provided — leave blank until the real values are available.
export const IF = '' // Identifiant Fiscal
export const PATENTE = '' // Taxe Professionnelle / Patente
export const TRIBUNAL = '' // Tribunal d'immatriculation (RC)

export const CURRENCY = 'MAD'

export const hasIF = IF.length > 0
export const hasPatente = PATENTE.length > 0
export const hasTribunal = TRIBUNAL.length > 0
