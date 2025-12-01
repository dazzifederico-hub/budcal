import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mappa standard dei colori di Google Calendar (ID -> HEX)
const GOOGLE_COLORS = {
    '1': '#7986cb', // Lavender
    '2': '#33b679', // Sage
    '3': '#8e24aa', // Grape
    '4': '#e67c73', // Flamingo
    '5': '#f6bf26', // Banana
    '6': '#f4511e', // Tangerine
    '7': '#039be5', // Peacock
    '8': '#616161', // Graphite
    '9': '#3f51b5', // Blueberry
    '10': '#0b8043', // Basil
    '11': '#d50000', // Tomato
    'default': '#9aa0a6' // Gray generic
};

export const ColorMapper = ({ mapping, onUpdate }) => {
    
  const handleTypeChange = (val) => {
     const updated = { ...mapping, type: val };
     onUpdate(updated);
  };

  const handleAmountChange = (e) => {
      const updated = { ...mapping, defaultAmount: e.target.value };
      onUpdate(updated);
  };

  // Risolvi il colore reale da mostrare
  const displayColor = GOOGLE_COLORS[mapping.colorId] || mapping.colorId;
  const displayName = mapping.colorId === 'default' ? 'Colore Calendario (Default)' : `Colore ${mapping.colorId}`;

  return (
    <Card className="mb-3 shadow-none border-border bg-muted/20">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
            <div 
                className="w-8 h-8 rounded-full border shadow-sm shrink-0" 
                style={{ backgroundColor: displayColor }}
            ></div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                    {displayName}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                    ID: {mapping.colorId}
                </span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Tipo</Label>
                <Select value={mapping.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="unclassified">Ignora</SelectItem>
                        <SelectItem value="income">Entrata</SelectItem>
                        <SelectItem value="expense">Uscita</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Default €</Label>
                <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    placeholder="0.00" 
                    value={mapping.defaultAmount} 
                    onChange={handleAmountChange} 
                />
             </div>
        </div>
      </CardContent>
    </Card>
  );
};
