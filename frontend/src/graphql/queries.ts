import { gql } from '@apollo/client';

// Selecciona SOLO los campos que el catálogo necesita: name, price,
// presentation. Esto demuestra que GraphQL evita over-fetching frente
// a un endpoint REST que devolvería el registro completo siempre.
export const GET_MEDICATIONS = gql`
  query GetMedications($filter: MedicationFilterInput, $page: Int, $limit: Int) {
    medications(filter: $filter, page: $page, limit: $limit) {
      items {
        id
        name
        price
        presentation
      }
      total
      page
      limit
    }
  }
`;

export const GET_MEDICATION_DETAIL = gql`
  query GetMedicationDetail($id: ID!) {
    medication(id: $id) {
      id
      name
      activeIngredient
      category
      dosage
      presentation
      manufacturer
      description
      price
      stock
      requiresPrescription
    }
  }
`;

export const GET_CART = gql`
  query GetCart($id: ID!) {
    cart(id: $id) {
      id
      status
      total
      items {
        id
        quantity
        subtotal
        medication {
          id
          name
          price
          presentation
          requiresPrescription
        }
      }
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      status
      total
      createdAt
      items {
        id
        quantity
        unitPrice
        subtotal
        medication {
          id
          name
          presentation
        }
      }
    }
  }
`;
