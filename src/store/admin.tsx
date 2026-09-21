import { useState } from 'react';
import { blankProduct } from './admin-product-config';
import AdminProductEditor from './admin-product-editor';
import AdminProductsSection from './admin-products-section';
import AdminOrdersSection from './admin-orders-section';
import AdminRemoveDialog from './admin-remove-dialog';
import type { Product } from './types';
import { useAdminData } from './use-admin-data';

const Admin = () => {
  const data = useAdminData();
  const [editing, setEditing] = useState<Product | null>(null);
  const [removing, setRemoving] = useState<Product | null>(null);

  return (
    <section className="page">
      <p className="eyebrow">Мастерская</p>
      <h1>Управление магазином</h1>
      {data.error && (
        <p role="alert" className="error">
          {data.error}
        </p>
      )}
      <AdminProductsSection
        products={data.products}
        busy={data.busy}
        onCreate={() => {
          data.setError('');
          setEditing({ ...blankProduct });
        }}
        onEdit={(product) => {
          data.setError('');
          setEditing(product);
        }}
        onRemove={(product) => {
          data.setError('');
          setRemoving(product);
        }}
      />
      <AdminOrdersSection
        orders={data.orders}
        busy={data.busy}
        onStatus={(id, value) => void data.updateStatus(id, value)}
      />
      {editing && (
        <AdminProductEditor
          key={editing.id || 'new'}
          product={editing}
          busy={data.busy}
          error={data.error}
          close={() => setEditing(null)}
          save={(upload) => data.saveProduct(editing, upload)}
        />
      )}
      {removing && (
        <AdminRemoveDialog
          product={removing}
          busy={data.busy}
          error={data.error}
          close={() => setRemoving(null)}
          remove={() => {
            void data.removeProduct(removing).then((removed) => {
              if (removed) setRemoving(null);
            });
          }}
        />
      )}
    </section>
  );
};

export default Admin;
