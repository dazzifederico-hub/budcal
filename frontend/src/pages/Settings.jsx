import React, { useEffect, useState } from 'react';
import { dbService } from '@/services/db';
import { calendarService } from '@/services/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, RefreshCw, LogOut, Info, CheckCircle2, Search } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { GOOGLE_CONFIG } from '@/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  useEffect(() => {
    loadSettings();
    const savedTheme = localStorage.getItem('vite-ui-theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const loadSettings = async () => {
     if (window.gapi && window.gapi.client && window.gapi.client.getToken()) {
         setIsConnected(true);
     }
  };

  const handleConnect = async () => {
      setLoading(true);
      try {
        if (!calendarService.gisInited) {
            await new Promise((resolve) => {
                calendarService.init(GOOGLE_CONFIG.CLIENT_ID, GOOGLE_CONFIG.API_KEY, () => {
                    if (calendarService.gapiInited && calendarService.gisInited) resolve();
                });
            });
        }
        
        await calendarService.login();
        setIsConnected(true);
        toast.success("Connesso a Google");
        await handleSync();
      } catch (err) {
          console.error(err);
          toast.error("Errore di connessione");
      } finally {
          setLoading(false);
      }
  };

  const handleSync = async () => {
      setLoading(true);
      try {
          const res = await calendarService.syncEvents();
          
          if (res.totalFound > 0) {
             toast.success(
                 <div className="flex flex-col gap-2">
                     <span className="font-bold flex items-center gap-2"><CheckCircle2 size={14} /> Sync Completato</span>
                     
                     {res.rules && res.rules.length > 0 ? (
                         <div className="bg-muted p-2 rounded text-[10px] font-mono">
                            <strong>Regole attive:</strong>
                            <ul className="list-disc pl-3 mt-1">
                                {res.rules.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                         </div>
                     ) : (
                         <div className="text-destructive text-xs font-bold bg-destructive/10 p-2 rounded">
                             ⚠ Nessuna regola trovata!<br/>
                             L'app non legge le descrizioni.
                         </div>
                     )}

                     <span className="text-xs">Eventi analizzati: {res.totalFound}</span>
                     <span className="text-xs font-bold text-primary">Transazioni create: {res.createdTransactions}</span>
                 </div>
             );
          } else {
             toast.warning("Nessun evento trovato.");
          }
      } catch (err) {
          toast.error("Errore durante la sincronizzazione");
      } finally {
          setLoading(false);
      }
  };

  const runDiagnostics = async () => {
      try {
          setLoading(true);
          const info = await calendarService.debugCalendars();
          setDebugInfo(info);
      } catch(err) {
          toast.error("Errore diagnosi");
      } finally {
          setLoading(false);
      }
  };

  const handleDisconnect = async () => {
      await calendarService.logout();
      setIsConnected(false);
      toast.info("Disconnesso");
  };

  const toggleTheme = () => {
      const newT = theme === 'light' ? 'dark' : 'light';
      setTheme(newT);
      localStorage.setItem('vite-ui-theme', newT);
      document.documentElement.classList.toggle('dark', newT === 'dark');
  };

  const handleDownloadData = async () => {
      const zip = new JSZip();
      const txs = await dbService.getTransactions();
      const maps = await dbService.getColorMappings();
      
      zip.file("transactions.json", JSON.stringify(txs, null, 2));
      zip.file("color_mappings.json", JSON.stringify(maps, null, 2));
      zip.file("README.txt", "BUDCAL Data Export\nGenerated on " + new Date().toLocaleString());

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "budcal_data.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download avviato");
  };
  
  const clearDB = async () => {
      if(window.confirm("Sei sicuro? Questo cancellerà TUTTI i dati locali.")) {
          await dbService.clearAll();
          toast.success("Database pulito");
          window.location.reload();
      }
  }

  return (
    <div className="space-y-8 pb-10">
       <h1 className="text-xl font-bold">Impostazioni</h1>

       <div className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm">
           <div className="space-y-1">
               <Label className="text-base">Tema Scuro</Label>
               <p className="text-xs text-muted-foreground">Interfaccia dark mode</p>
           </div>
           <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
       </div>

       <Card className="shadow-sm border-border">
           <CardHeader>
               <CardTitle className="text-base">Google Calendar Sync</CardTitle>
               <CardDescription className="text-xs">Importazione automatica intelligente.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
               {!isConnected ? (
                   <Button onClick={handleConnect} disabled={loading} className="w-full">
                        {loading ? "Connessione..." : "Connetti Google Calendar"}
                   </Button>
               ) : (
                   <div className="space-y-3">
                       <div className="flex gap-2">
                           <Button onClick={handleSync} disabled={loading} className="flex-1" variant="outline">
                               <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
                               Sync Ora
                           </Button>
                           
                           <Dialog>
                               <DialogTrigger asChild>
                                   <Button variant="secondary" size="icon" onClick={runDiagnostics}>
                                       <Search size={16} />
                                   </Button>
                               </DialogTrigger>
                               <DialogContent className="max-h-[80vh] overflow-y-auto">
                                   <DialogHeader>
                                       <DialogTitle>Diagnostica Calendari</DialogTitle>
                                   </DialogHeader>
                                   <div className="space-y-2 text-xs">
                                       <p className="text-muted-foreground">Ecco cosa legge l'app dai tuoi calendari:</p>
                                       {debugInfo.map((info, i) => (
                                           <div key={i} className="border p-2 rounded bg-muted/50">
                                               <div className="font-bold">{info.name}</div>
                                               <div className="font-mono text-[10px] text-muted-foreground truncate">ID: {info.id}</div>
                                               <div className="mt-1">
                                                   <span className="text-muted-foreground">Descrizione letta: </span>
                                                   <span className="bg-background px-1 rounded border">
                                                       {info.description ? `"${info.description}"` : "VUOTA"}
                                                   </span>
                                               </div>
                                               <div className={`mt-1 font-bold ${info.ruleDetected !== "NESSUNA" ? "text-green-600" : "text-red-500"}`}>
                                                   Regola: {info.ruleDetected}
                                               </div>
                                           </div>
                                       ))}
                                       {debugInfo.length === 0 && <p>Clicca la lente per avviare la diagnosi...</p>}
                                   </div>
                               </DialogContent>
                           </Dialog>

                           <Button onClick={handleDisconnect} variant="destructive" size="icon">
                               <LogOut size={16} />
                           </Button>
                       </div>
                       <p className="text-xs text-center text-green-600 font-medium">● Connesso</p>
                   </div>
               )}
               
               <div className="bg-muted/30 p-3 rounded-md border border-border text-xs text-muted-foreground space-y-2">
                   <div className="flex items-center gap-2 font-medium text-primary">
                       <Info size={14} /> Istruzioni
                   </div>
                   <p>Se vedi "Nessuna regola trovata", usa il tasto <Search className="inline w-3 h-3"/> per vedere cosa sta leggendo l'app.</p>
               </div>
           </CardContent>
       </Card>

       <div className="pt-4 border-t border-border space-y-4">
           <Button variant="outline" className="w-full" onClick={handleDownloadData}>
               <Download size={16} className="mr-2" /> Scarica Dati (Backup)
           </Button>
           
           <a href="source_code.zip" download="budcal_source.zip" className="w-full block">
               <Button variant="secondary" className="w-full font-bold text-primary border border-primary/20">
                   <Download size={16} className="mr-2" /> SCARICA CODICE SORGENTE (ZIP)
               </Button>
           </a>

           <Button variant="ghost" className="w-full text-destructive text-xs hover:bg-destructive/10" onClick={clearDB}>
               Reset Totale App
           </Button>
       </div>
    </div>
  );
}
