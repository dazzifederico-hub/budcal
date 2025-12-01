import React, { useEffect, useState } from 'react';
import { dbService } from '@/services/db';
import { TransactionList } from '@/components/shared/TransactionList';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export default function TransactionsPage({ type }) {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const all = await dbService.getTransactions();
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayTime = today.getTime();

    const filtered = all
        .filter(t => {
            const tDate = new Date(t.date).getTime();
            return t.type === type && tDate <= todayTime;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(filtered);
  };

  useEffect(() => {
    loadData();
  }, [type]);

  const handleDelete = async (id) => {
     if (window.confirm("Sicuro di voler eliminare?")) {
         await dbService.deleteTransaction(id);
         toast.success("Eliminato");
         loadData();
     }
  };

  const handleEdit = async (tx) => {
      try {
          // Convert to manual source to prevent overwrite by GCal sync
          const updatedTx = {
              ...tx,
              amount: parseFloat(tx.amount),
              source: 'manual' 
              // We KEEP gcalEventId so the sync logic knows to skip the original
          };
          await dbService.addTransaction(updatedTx);
          toast.success("Modifica salvata");
          loadData();
      } catch (err) {
          toast.error("Errore salvataggio");
      }
  };

  const displayTxs = transactions.filter(t => 
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold capitalize">{type === 'income' ? 'Entrate' : 'Uscite'}</h1>
        <div className="bg-primary/5 px-3 py-1 rounded-full text-xs font-medium tabular-nums">
            {displayTxs.length} transazioni
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Cerca..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        <TransactionList 
            transactions={displayTxs} 
            onDelete={handleDelete} 
            onEdit={handleEdit}
            emptyMessage="Nessun dato trovato" 
        />
      </div>
    </div>
  );
}
