import { useState } from 'react';
import { LegalDialog } from './legal';
import type { LegalDocument } from './types';

const PaymentTerms = ({ documents }: { documents: LegalDocument[] }) => {
  const [selected, setSelected] = useState<LegalDocument | null>(null);
  return (
    <>
      <div className="payment-documents">
        {documents.map((document) => (
          <button
            type="button"
            className="text-link"
            key={document.id}
            onClick={() => setSelected(document)}
          >
            {document.title}
          </button>
        ))}
      </div>
      {selected && <LegalDialog document={selected} close={() => setSelected(null)} />}
    </>
  );
};
export default PaymentTerms;
