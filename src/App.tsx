import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Suggestion = lazy(() => import('./pages/Suggestion'));
const CategoryPage = lazy(() => import('./pages/Category'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-4 flex justify-center py-12 text-mil-neutral">Carregando...</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}
