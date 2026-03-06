import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Suggestion from './pages/Suggestion';
import CategoryPage from './pages/Category';
import ItemDetail from './pages/ItemDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="suggestion" element={<Suggestion />} />
          <Route path="category/:id" element={<CategoryPage />} />
          <Route path="item/:id" element={<ItemDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
