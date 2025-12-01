import React, { useEffect, useState } from 'react';
import { dbService } from '@/services/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
    Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function Stats() {
  const [range, setRange] = useState('30'); // days
  const [chartData, setChartData] = useState([]); // Bar chart (Time)
  const [pieData, setPieData] = useState({ income: [], expense: [] }); // Pie charts (Category)

  useEffect(() => {
    const load = async () => {
        const txs = await dbService.getTransactions();
        processData(txs, range);
    };
    load();
  }, [range]);

  const processData = (txs, days) => {
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() - parseInt(days));
    limit.setHours(0, 0, 0, 0); // Start of that day

    // Filter by Range
    const filtered = txs.filter(t => new Date(t.date) >= limit && new Date(t.date) <= now);

    // --- 1. Prepare Time Series Data (Bar Chart) ---
    const timeGroups = {};
    // Initialize dates
    for(let d = new Date(limit); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        timeGroups[dateStr] = { date: dateStr, income: 0, expense: 0 };
    }

    filtered.forEach(t => {
        const dateStr = t.date.split('T')[0];
        if (timeGroups[dateStr]) {
            if (t.type === 'income') timeGroups[dateStr].income += Number(t.amount);
            else timeGroups[dateStr].expense += Number(t.amount);
        }
    });
    setChartData(Object.values(timeGroups));

    // --- 2. Prepare Category Data (Pie Charts) ---
    const incomeGroups = {};
    const expenseGroups = {};

    filtered.forEach(t => {
        const category = t.calendarName || 'Manuale';
        const amount = Number(t.amount);
        
        if (t.type === 'income') {
            incomeGroups[category] = (incomeGroups[category] || 0) + amount;
        } else {
            expenseGroups[category] = (expenseGroups[category] || 0) + amount;
        }
    });

    const formatPie = (groups) => Object.entries(groups)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Descending

    setPieData({
        income: formatPie(incomeGroups),
        expense: formatPie(expenseGroups)
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2 rounded shadow-lg text-xs">
          <p className="font-bold mb-1">{formatDate(label)}</p>
          <p className="text-primary">Entrate: {formatCurrency(payload[0].value)}</p>
          <p className="text-muted-foreground">Uscite: {formatCurrency(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8">
       <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Statistiche</h1>
        <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7">7 Giorni</SelectItem>
                <SelectItem value="30">30 Giorni</SelectItem>
                <SelectItem value="90">3 Mesi</SelectItem>
                <SelectItem value="180">6 Mesi</SelectItem>
                <SelectItem value="365">1 Anno</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Time Series Chart */}
      <Card className="border-border shadow-sm">
        <CardHeader>
            <CardTitle className="text-sm font-medium">Andamento Temporale</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] p-0 pb-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis 
                        dataKey="date" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).getDate()} 
                        minTickGap={20}
                    />
                    <YAxis 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => `€${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <Card className="border-border shadow-sm">
          <CardHeader>
              <CardTitle className="text-sm font-medium">Ripartizione per Fonte (Calendario)</CardTitle>
          </CardHeader>
          <CardContent>
              <Tabs defaultValue="expense" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="income">Entrate</TabsTrigger>
                      <TabsTrigger value="expense">Uscite</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="income" className="h-[300px] w-full">
                      {pieData.income.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={pieData.income}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={2}
                                      dataKey="value"
                                  >
                                      {pieData.income.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => formatCurrency(value)} />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Nessun dato</div>
                      )}
                  </TabsContent>
                  
                  <TabsContent value="expense" className="h-[300px] w-full">
                      {pieData.expense.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={pieData.expense}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={2}
                                      dataKey="value"
                                  >
                                      {pieData.expense.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => formatCurrency(value)} />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Nessun dato</div>
                      )}
                  </TabsContent>
              </Tabs>
          </CardContent>
      </Card>
    </div>
  );
}
