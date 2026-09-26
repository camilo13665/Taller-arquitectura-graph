import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CART } from '../graphql/mutations';
import { GET_CART } from '../graphql/queries';

const CART_STORAGE_KEY = 'afirmative_pill_cart_id';

/**
 * Hook que garantiza que exista un carrito activo. Si no hay uno
 * guardado localmente, crea uno nuevo vía mutation `createCart`
 * (nunca vía REST). El id se persiste en localStorage para sobrevivir
 * recargas de página durante la demo.
 */
export function useCart() {
  const [cartId, setCartId] = useState<string | null>(() => localStorage.getItem(CART_STORAGE_KEY));
  const [createCart] = useMutation(CREATE_CART);

  useEffect(() => {
    if (!cartId) {
      createCart().then(({ data }) => {
        const newCartId = data?.createCart?.cart?.id;
        if (newCartId) {
          localStorage.setItem(CART_STORAGE_KEY, newCartId);
          setCartId(newCartId);
        }
      });
    }
  }, [cartId, createCart]);

  const { data, loading, error, refetch } = useQuery(GET_CART, {
    variables: { id: cartId },
    skip: !cartId,
    fetchPolicy: 'network-only',
  });

  const resetCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    setCartId(null);
  }, []);

  return {
    cartId,
    cart: data?.cart ?? null,
    loading: !cartId || loading,
    error,
    refetch,
    resetCart,
  };
}
