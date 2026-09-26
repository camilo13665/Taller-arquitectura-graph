import { gql } from '@apollo/client';

export const ORDER_STATUS_CHANGED = gql`
  subscription OrderStatusChanged($orderId: ID!) {
    orderStatusChanged(orderId: $orderId) {
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
