import { throws } from 'node:assert';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps
{
  children: ReactNode;
}

interface UpdateProductAmount 
{
  productId: number;
  amount: number;
}

interface CartContextData 
{
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);
const keyLocalStorage = '@RocketShoes:cart';

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) 
     {
      return JSON.parse(storagedCart);
     }

    return [];
  });

  
  const addProduct = async (productId: number) => {

    try {
      
      const updateCart = [...cart];
      
      const productAlreadyInCart = cart.find(product => product.id == productId);

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      const stockAmount = stock.amount;
     
      const currentAmount = productAlreadyInCart ? productAlreadyInCart.amount : 0;
      
      const amout = currentAmount + 1;
     
      if(amout > stockAmount)
      {
        toast.error('Quantidade solicitada fora de estoque');
       
        return;
      }
   
      if(productAlreadyInCart)
      {
        productAlreadyInCart.amount = amout;
      }
      else{
          const { data: product } = await api.get<Product>(`/products/${productId}`);
          const newProduct = { 
            ...product,
            amount: 1,
          }
        
          updateCart.push(newProduct);
      }
    
      setCart(updateCart);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
    }
      catch 
      {
        toast.error('Erro na adição do produto');
      }
    
};

  const removeProduct = (productId: number) => {
    try 
    {
     
      const statusCart = [...cart];
      
      const indexProduct = statusCart.findIndex((item) => item.id === productId);
      
      if(indexProduct >= 0)
      {
        statusCart.splice(indexProduct, 1)
        setCart(statusCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(statusCart));        
      }
      else{
        throw Error();
      }
   } 
      catch 
      {
        toast.error('Erro na remoção do produto');
      }
  };

  const updateProductAmount = async  ({ productId, amount}: UpdateProductAmount) => {
    try 
    {
      if(amount <= 0)
      {
        return;
      }
      
      const stockCart = await api.get(`/stock/${productId}`);
      const newStock = stockCart.data.amount;
      
     
      if( amount > newStock)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const statusCart = [...cart];
      const productExists = statusCart.find((item) => item.id === productId);
     
      if(productExists)
      {
        
        productExists.amount = amount;
     
        setCart(statusCart);

    
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(statusCart));   
      }
      else{
        throw Error();
      }
    }
    catch {
      toast.error('Erro na alteração de quantidade do produto');
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

export function useCart(): CartContextData 
{
  const context = useContext(CartContext);

  return context;
}
