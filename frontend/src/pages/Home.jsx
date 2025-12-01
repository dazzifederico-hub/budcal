import React, { useEffect, useState } from 'react';
import { dbService } from '@/services/db';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { TransactionList } from '@/components/shared/TransactionList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [allTransactions, setAllTransactions] = useState([]); // Store all fetched
  const [displayedTransactions, setDisplayTransactions] = useState([]); // Store filtered
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [period, setPeriod] = useState('month'); // Default to Month for "glance"
  
  const [newTx, setNewTx] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('expense');

  const fetchData = async () => {
    const txs = await dbService.getTransactions();
    
    // Basic validity filter (up to End of Today)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayTime = today.getTime();

    const validTxs = txs.filter(t => {
        const tDate = new Date(t.date).getTime();
        return tDate <= todayTime;
    });

    setAllTransactions(validTxs);
    // Trigger calculation based on validTxs and current period
    calculateSummary(validTxs, period);
  };

  const calculateSummary = (txs, currentPeriod) => {
      const now = new Date();
      let startTime = 0;

      switch(currentPeriod) {
          case 'month':
              // First day of current month
              startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
              break;
          case 'semester':
              // 6 months ago
              const sixMonthsAgo = new Date(now);
              sixMonthsAgo.setMonth(now.getMonth() - 6);
              startTime = sixMonthsAgo.getTime();
              break;
          case 'year':
              // Jan 1st of current year
              startTime = new Date(now.getFullYear(), 0, 1).getTime();
              break;
          case 'all':
              startTime = 0;
              break;
      }

      const filtered = txs.filter(t => new Date(t.date).getTime() >= startTime);
      
      let income = 0;
      let expense = 0;
      filtered.forEach(t => {
          if (t.type === 'income') income += Number(t.amount);
          if (t.type === 'expense') expense += Number(t.amount);
      });

      setSummary({ balance: income - expense, income, expense });
      
      // For the list below, do we show only period txs or always "Recent"?
      // Usually "Recent" implies latest regardless of filter, BUT for consistency let's show filtered list?
      // User said "così anche entrate e uscite", implying lists should reflect period.
      // BUT Home usually shows "Recent Activity". 
      // Let's keep "Recent" as "Recent 5 of ALL" to be safe, OR "Recent 5 of Filtered".
      // "Recent 5 of Filtered" is less confusing visually.
      
      const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
      setDisplayTransactions(sorted.slice(0, 5));
  };

  // Re-calc when period changes
  useEffect(() => {
      if (allTransactions.length > 0) {
          calculateSummary(allTransactions, period);
      }
  }, [period, allTransactions]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.description) {
        toast.error("Compila tutti i campi");
        return;
    }

    try {
        await dbService.addTransaction({
            ...newTx,
            amount: parseFloat(newTx.amount),
            type: activeTab,
            source: 'manual'
        });
        toast.success("Transazione aggiunta");
        setNewTx({ ...newTx, amount: '', description: '' });
        fetchData();
    } catch (err) {
        toast.error("Errore nel salvataggio");
    }
  };

  const handleDelete = async (id) => {
      if (window.confirm("Eliminare questa transazione?")) {
          await dbService.deleteTransaction(id);
          toast.success("Eliminata");
          fetchData();
      }
  };
  
  const handleEdit = async (tx) => {
      try {
          const updatedTx = { ...tx, amount: parseFloat(tx.amount), source: 'manual' };
          await dbService.addTransaction(updatedTx);
          toast.success("Modifica salvata");
          fetchData();
      } catch (err) {
          toast.error("Errore salvataggio");
      }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">BUDCAL</h1>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">Oggi: {new Date().toLocaleDateString()}</span>
      </div>

      <SummaryCard 
        {...summary} 
        period={period} 
        onPeriodChange={setPeriod} 
      />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="income" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                        <Plus className="mr-2 h-3 w-3" /> Entrata
                    </TabsTrigger>
                    <TabsTrigger value="expense" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                        <Minus className="mr-2 h-3 w-3" /> Uscita
                    </TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs">Importo (€)</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={newTx.amount}
                                onChange={e => setNewTx({...newTx, amount: e.target.value})}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs">Data</Label>
                            <Input 
                                id="date" 
                                type="date" 
                                value={newTx.date}
                                onChange={e => setNewTx({...newTx, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-xs">Descrizione</Label>
                        <Input 
                            id="desc" 
                            placeholder="Spesa, Stipendio..." 
                            value={newTx.description}
                            onChange={e => setNewTx({...newTx, description: e.target.value})}
                        />
                    </div>
                    <Button type="submit" className="w-full font-semibold">
                        Aggiungi {activeTab === 'income' ? 'Entrata' : 'Uscita'}
                    </Button>
                </form>
            </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">
            Ultimi Movimenti ({period === 'all' ? 'Tutti' : period})
        </h3>
        <TransactionList 
            transactions={displayedTransactions} 
            onDelete={handleDelete} 
            onEdit={handleEdit} 
        />
      </div>
    </div>
  );
}
