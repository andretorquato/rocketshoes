import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get<Stock>(`/stock/${productId}`);
      const productOnStock = responseStock.data ;
      
      if(productOnStock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const productResponse = await api.get<Product>(`/products/${productId}`)
      const product = productResponse.data

      const newCart = [...cart]
      const productExistsOnCart = newCart.find(product => product.id === productId);

      if(productExistsOnCart) {
        productExistsOnCart.amount += 1
        setCart(newCart)
      } else {
        const newProduct = {
          ...product,
          amount: 1
        }
        newCart.push(newProduct)
      }
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch(err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      
      const productIndex = newCart.findIndex(product => product.id === productId)

      if(!newCart[productIndex]) {
        throw Error();
      } 

      newCart.splice(productIndex, 1)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseProduct = await api.get<Stock>(`/stock/${productId}`);
      const productStockAmount = responseProduct.data.amount;

      if(productStockAmount <= 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const newCart = [...cart]
      const product = newCart.find(product => product.id === productId);      
      if(!product) throw Error();

      product.amount = amount;

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch(error) {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}