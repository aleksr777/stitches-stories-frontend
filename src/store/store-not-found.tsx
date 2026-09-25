import { Link } from 'react-router-dom';

const StoreNotFound = () => (
  <section className="page empty">
    <h1>Эта история ещё не написана</h1>
    <p>Страница не найдена.</p>
    <Link className="button" to="/catalog">
      В коллекцию
    </Link>
  </section>
);
export default StoreNotFound;
