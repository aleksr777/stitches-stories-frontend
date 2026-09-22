import type { Category, Product } from './types';

const AdminProductFields = ({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) => (
  <>
    <div className="product-editor-details">
      <label>
        Название
        <input name="name" defaultValue={product.name} minLength={2} maxLength={200} required />
      </label>
      <label>
        Категория
        <select name="category" defaultValue={product.category ?? ''}>
          <option value="">Без категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Цена, ₽
        <input
          name="priceRub"
          type="number"
          min={0}
          step={1}
          max={1000000}
          defaultValue={product.priceRub}
          required
        />
      </label>
      <label className="product-editor-wide">
        Описание
        <textarea
          name="description"
          defaultValue={product.description}
          minLength={10}
          maxLength={6000}
        />
      </label>
      {(['materials', 'dimensions', 'productionTime'] as const).map((key, index) => (
        <label className={key === 'productionTime' ? 'product-editor-wide' : undefined} key={key}>
          {['Материалы', 'Размеры', 'Срок изготовления'][index]}
          <input
            name={key}
            defaultValue={product[key]}
            minLength={2}
            maxLength={key === 'materials' ? 250 : key === 'dimensions' ? 100 : 160}
          />
        </label>
      ))}
    </div>
    <label className="product-editor-stock">
      Доступное количество
      <input type="number" name="stock" min={0} max={10000} defaultValue={product.stock} />
    </label>
    <div className="product-editor-options">
      {(['featured', 'active', 'isDemo'] as const).map((key, index) => (
        <label className="check" key={key}>
          <input name={key} type="checkbox" defaultChecked={product[key]} />
          <span>
            {['Показывать на главной', 'Показывать в каталоге', 'Демонстрационный товар'][index]}
          </span>
        </label>
      ))}
    </div>
  </>
);

export default AdminProductFields;
