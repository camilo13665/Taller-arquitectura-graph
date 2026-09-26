import { gql } from '@apollo/client';

const ERROR_FIELDS = gql`
  fragment ErrorFields on OperationError {
    code
    message
  }
`;

export const CREATE_CART = gql`
  ${ERROR_FIELDS}
  mutation CreateCart {
    createCart {
      success
      cart {
        id
        status
      }
      error {
        ...ErrorFields
      }
    }
  }
`;

export const ADD_ITEM_TO_CART = gql`
  ${ERROR_FIELDS}
  mutation AddItemToCart($input: AddItemToCartInput!) {
    addItemToCart(input: $input) {
      success
      cart {
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
          }
        }
      }
      error {
        ...ErrorFields
      }
    }
  }
`;

export const VALIDATE_PRESCRIPTION = gql`
  ${ERROR_FIELDS}
  mutation ValidatePrescription($input: ValidatePrescriptionInput!) {
    validatePrescription(input: $input) {
      success
      prescription {
        id
        documentRef
        issuedBy
        isValid
      }
      error {
        ...ErrorFields
      }
    }
  }
`;

export const SUBMIT_ORDER = gql`
  ${ERROR_FIELDS}
  mutation SubmitOrder($input: SubmitOrderInput!) {
    submitOrder(input: $input) {
      success
      order {
        id
        status
        total
        createdAt
      }
      error {
        ...ErrorFields
      }
    }
  }
`;

export const APPROVE_ORDER = gql`
  ${ERROR_FIELDS}
  mutation ApproveOrder($orderId: ID!) {
    approveOrder(orderId: $orderId) {
      success
      order {
        id
        status
      }
      error {
        ...ErrorFields
      }
    }
  }
`;

export const CANCEL_ORDER = gql`
  ${ERROR_FIELDS}
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      success
      order {
        id
        status
      }
      error {
        ...ErrorFields
      }
    }
  }
`;
