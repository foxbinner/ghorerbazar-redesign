import Navbar from './Navbar';
import CartSidebar from './CartSidebar';
import Footer from './Footer';
import StickyFooter from './StickyFooter';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <CartSidebar />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <Footer />
      <StickyFooter />
    </div>
  );
}
