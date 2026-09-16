import Modal from './modal';
import { useStore } from './context';
import type { LegalDocument } from './types';
export const DocumentButton = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { showDocument } = useStore();
  return (
    <button className="text-link" type="button" onClick={() => showDocument(id)}>
      {children}
    </button>
  );
};
export const Acceptance = ({ id, label }: { id: string; label: string }) => (
  <label className="check">
    <input type="checkbox" name={id} required />
    <span>
      {label} <DocumentButton id={id}>Открыть документ</DocumentButton>
    </span>
  </label>
);
export const LegalDialog = ({
  document,
  close,
}: {
  document: LegalDocument;
  close: () => void;
}) => (
  <Modal title={document.fullTitle ?? document.title} onClose={close}>
    {document.status !== 'published' && (
      <p className="notice">
        Проект документа. Перед запуском заполняются реквизиты продавца и сведения о сервисах.
      </p>
    )}
    <p>{document.notice}</p>
    <div className="document-body">
      {document.sections.map(([heading, body], i) => (
        <section key={i}>
          <h3>{heading}</h3>
          <p>{body}</p>
        </section>
      ))}
    </div>
    <p className="muted">Версия: {document.version}</p>
    <button className="button" onClick={close}>
      Закрыть документ
    </button>
  </Modal>
);
export const DocumentsPage = () => {
  const { documents } = useStore();
  return (
    <section className="page narrow">
      <p className="eyebrow">Открыто и понятно</p>
      <h1>Документы магазина</h1>
      <p>
        Здесь можно ознакомиться с условиями покупки, обработкой данных и отдельными согласиями.
      </p>
      <div className="document-list">
        {documents.map((d) => (
          <article key={d.id}>
            <DocumentButton id={d.id}>{d.title}</DocumentButton>
            {d.status !== 'published' && <small>Проект</small>}
          </article>
        ))}
      </div>
    </section>
  );
};
