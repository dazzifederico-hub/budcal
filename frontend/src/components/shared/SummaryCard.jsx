import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const SummaryCard = ({ balance, income, expense, period, onPeriodChange }) => {
  
  const getLabel = () => {
      switch(period) {
          case 'month': return 'Risparmio Mensile';
          case 'semester': return 'Saldo Semestrale';
          case 'year': return 'Saldo Annuale';
          default: return 'Saldo Totale';
      }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="col-span-2 shadow-sm border-primary/10 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {getLabel()}
                </CardTitle>
                
                <Select value={period} onValueChange={onPeriodChange}>
                    <SelectTrigger className="w-[100px] h-7 text-xs bg-background/50 border-primary/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Mese</SelectItem>
                        <SelectItem value="semester">6 Mesi</SelectItem>
                        <SelectItem value="year">Anno</SelectItem>
                        <SelectItem value="all">Totale</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold tracking-tighter">{formatCurrency(balance)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {period === 'all' ? 'Disponibilità attuale' : 'Differenza entrate/uscite nel periodo'}
                </p>
            </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4 col-span-2">
            <Card className="shadow-sm border-border">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Entrate</span>
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-bold tracking-tight">{formatCurrency(income)}</div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium uppercase">Uscite</span>
                        <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-lg font-bold tracking-tight">-{formatCurrency(expense)}</div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};
