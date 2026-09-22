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
    <a
      className="button contact-text"
      href="https://vk.ru/stitchs_and_stories"
      target="_blank"
      rel="noreferrer"
    >
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
