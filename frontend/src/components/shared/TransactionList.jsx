import React, { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const TransactionList = ({ transactions, onDelete, onEdit, emptyMessage = "Nessuna transazione" }) => {
  const [editingTx, setEditingTx] = useState(null);

  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-10 text-muted-foreground text-sm italic">{emptyMessage}</div>;
  }

  const grouped = transactions.reduce((acc, tx) => {
      const dateKey = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const handleSaveEdit = (e) => {
      e.preventDefault();
      if (editingTx) {
          onEdit(editingTx);
          setEditingTx(null);
      }
  };

  return (
    <div className="space-y-6 pb-4">
      {sortedDates.map((date) => {
        const dayTransactions = grouped[date];
        const dayTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        return (
            <div key={date} className="space-y-2">
                <div className="flex items-center justify-between px-1 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/50">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {formatDate(date)}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                        Tot: {formatCurrency(dayTotal)}
                    </Badge>
                </div>

                <div className="border border-border rounded-lg bg-card shadow-sm divide-y divide-border overflow-hidden">
                    {dayTransactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                            <span className="font-medium text-sm truncate pr-2">
                                {tx.description || 'Nessuna descrizione'}
                            </span>
                            {tx.calendarName && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                    {tx.calendarName}
                                </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn(
                              "font-semibold text-sm tabular-nums tracking-tight mr-2",
                              tx.type === 'income' ? "text-primary" : "text-primary"
                            )}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                              onClick={() => setEditingTx(tx)}
                            >
                              <Pencil size={14} />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(tx.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      })}

      {/* Edit Modal */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Modifica Transazione</DialogTitle>
              </DialogHeader>
              {editingTx && (
                  <form onSubmit={handleSaveEdit} className="space-y-4">
                      <div className="space-y-2">
                          <Label>Descrizione</Label>
                          <Input 
                              value={editingTx.description} 
                              onChange={e => setEditingTx({...editingTx, description: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Importo (€)</Label>
                          <Input 
                              type="number" 
                              step="0.01"
                              value={editingTx.amount} 
                              onChange={e => setEditingTx({...editingTx, amount: e.target.value})}
                          />
                      </div>
                      <DialogFooter>
                          <Button type="submit">Salva Modifiche</Button>
                      </DialogFooter>
                  </form>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
};
