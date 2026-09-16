import { Link } from 'react-router-dom';
import { useStore } from './context';
import { ProductCard } from './products';
import { DocumentButton } from './legal';
export const About = () => (
  <section className="page narrow">
    <p className="eyebrow">О мастерской</p>
    <h1>
      Сначала — ниточка.
      <br />
      Потом — ваша история.
    </h1>
    <p className="lead">Stitches &amp; Stories — маленькая мастерская вещей с ручной вышивкой.</p>
    <p>
      Брелоки и обложки на паспорт рождаются стежок за стежком. За рисунком и оттенком нитей —
      внимание к деталям и любовь к своему делу.
    </p>
    <p>Чтобы обсудить индивидуальные пожелания, напишите мастеру.</p>
    <a className="button" href="https://vk.ru/stitchs_and_stories" target="_blank" rel="noreferrer">
      Связаться ВКонтакте
    </a>
  </section>
);
export const Delivery = () => (
  <section className="page narrow">
    <p className="eyebrow">С заботой о деталях</p>
    <h1>Доставка и оплата</h1>
    <ol className="steps">
      <li>
        <h2>Выберите свою историю</h2>
        <p>
          Добавьте понравившиеся изделия в корзину и отправьте заявку. Регистрация необязательна.
        </p>
      </li>
      <li>
        <h2>Обсудим детали</h2>
        <p>Мастер подтвердит наличие, сроки изготовления, стоимость и способ доставки по России.</p>
      </li>
      <li>
        <h2>Оплата после согласования</h2>
        <p>
          Способ оплаты и итоговая стоимость согласуются отдельно. На этом этапе сайт не принимает
          платежи.
        </p>
      </li>
    </ol>
    <div className="actions">
      <DocumentButton id="payment">Оплата и чек НПД</DocumentButton>
      <DocumentButton id="returns">Возвраты и обращения</DocumentButton>
      <DocumentButton id="seller">Сведения о продавце</DocumentButton>
    </div>
  </section>
);
const Home = () => {
  const { products, loading } = useStore();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Создано руками. Выбрано сердцем.</p>
          <h1>
            Маленькие вещи.
            <br />
            <em>Большие чувства.</em>
          </h1>
          <p className="lead">
            Брелоки и обложки с вышивкой — чтобы любимые истории всегда были рядом.
          </p>
          <Link className="button" to="/catalog">
            Найти свою историю
          </Link>
          <p className="tiny">Брелоки / Обложки на паспорт</p>
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
        ) : (
          <div className="product-grid">
            {products
              .filter((p) => p.featured)
              .slice(0, 4)
              .map((p) => (
                <ProductCard product={p} key={p.id} />
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
