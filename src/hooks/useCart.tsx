import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const getProduct: Product[] = products.filter(product => product.id === productId);
      
      let newProduct: Product = {
        ...getProduct[0],
        amount: getProduct[0].amount ?? 1,
      };
      
      const productInCart= cart.find(product => product.id === productId);
      if(productInCart){
        const productStock = stock.find(product => product.id === productId)?.amount || 0;
        

        if(productStock > productInCart.amount){
      
        let newCart: Product[]= await cart.map(product => {
          product.id === productId && product.amount++;
          return product;
        });
        setCart([...newCart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));          
        
      }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }
        
        
      }else{
        setCart([...cart, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));        

      }
      
      
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
    const newCart: Product[] = cart.filter(product => product.id !== productId);
    
    setCart([...newCart]);

    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        const newCart: Product[] = cart.map(product => {
          const productStock = stock.find(product => product.id === productId)?.amount || 0;
          if(product.id === productId){
    
            let lastProductAmout = product.amount;
  
            amount !== product.amount && (product.amount = amount)
            
            if(productStock < amount){
              product.amount = lastProductAmout;
              toast.error('Quantidade solicitada fora de estoque');
            } 
          }
          return product;
        })

        setCart([...newCart]);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      
    } catch {
      toast.error('Erro na alteração da quantidade produto');
    }
  };

  useEffect(()=>{
    api.get('products')
    .then(response => setProducts([...response.data]))
    api.get('stock')
    .then(response => setStock([...response.data]));
  }, []);

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
