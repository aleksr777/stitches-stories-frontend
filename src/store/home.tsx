import { Link } from 'react-router-dom';
import { useStore } from './context';
import { ProductCard } from './products';

export { About, Delivery } from './info-pages';

const Home = () => {
  const { products, loading } = useStore();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Создано с заботой. Выбрано сердцем.</p>
          <h1>
            Маленькие вещи.
            <br />
            <em>Большие чувства.</em>
          </h1>
          <p className="lead">
            Изделия с вышивкой — для тёплых подарков, уютного дома и любимых историй на каждый день.
          </p>
          <Link className="button" to="/catalog">
            Найти свою историю
          </Link>
          <p className="tiny">Вышивка с характером / Внимание к каждой детали</p>
        </div>
        <img
          className="hero-image"
          src={import.meta.env.BASE_URL + 'embroidery-hoop.svg'}
          alt="Пяльцы и ниточка — символ мастерской Stitches & Stories"
        />
      </section>
      <section className="collection container">
        <p className="eyebrow">Выбрано с теплом</p>
        <div className="section-heading">
          <h2>Выберите свою историю</h2>
          <Link className="text-link" to="/catalog">
            Вся коллекция →
          </Link>
        </div>
        {loading ? (
          <p role="status">Загружаем коллекцию…</p>
        ) : products.length === 0 ? (
          <div className="collection-empty">
            <p>Новые изделия уже готовятся — скоро здесь появится первая история.</p>
            <Link className="text-link" to="/catalog">
              Заглянуть в коллекцию →
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products
              .filter((product) => product.featured)
              .slice(0, 4)
              .map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
          </div>
        )}
      </section>
      <section className="story container">
        <div>
          <p className="eyebrow">О мастерской</p>
          <h2>
            Сначала — ниточка.
            <br />
            Потом — ваша история.
          </h2>
        </div>
        <div>
          <p>
            Есть вещи, которые выбирают сердцем. За рисунком, оттенком и каждым стежком — внимание к
            деталям и любовь к своему делу.
          </p>
          <Link className="text-link" to="/about">
            Заглянуть в мастерскую →
          </Link>
        </div>
      </section>
      <p className="closing container">Для себя. Для близкого. С теплом.</p>
    </>
  );
};

export default Home;
