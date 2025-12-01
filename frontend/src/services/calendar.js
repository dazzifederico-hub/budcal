import { dbService } from './db';

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

function parseBudgetTags(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const incomeMatch = lower.match(/(?:entrat[aei]|income|ricav[oi]|incass[oi])[\s:.]*€?\s*(\d+[.,]?\d*)/);
    const expenseMatch = lower.match(/(?:uscit[aei]|spes[ae]|expense|cost[oi]|pagament[oi])[\s:.]*€?\s*(\d+[.,]?\d*)/);
    
    if (incomeMatch) return { type: 'income', amount: parseFloat(incomeMatch[1].replace(',', '.')) };
    if (expenseMatch) return { type: 'expense', amount: parseFloat(expenseMatch[1].replace(',', '.')) };
    return null;
}

export const calendarService = {
  tokenClient: null,
  gapiInited: false,
  gisInited: false,

  init(clientId, apiKey, updateStatus) {
    if (!clientId || !apiKey) return;

    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
      window.gapi.load('client', async () => {
        try {
            await window.gapi.client.init({
                apiKey: apiKey,
                discoveryDocs: [DISCOVERY_DOC],
            });
            this.gapiInited = true;
            
            // RESTORE TOKEN IF VALID
            this.restoreToken();
            
            updateStatus();
        } catch(e) {
            console.error("GAPI init error", e);
        }
      });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '',
      });
      this.gisInited = true;
      updateStatus();
    };
    document.body.appendChild(script2);
  },

  // New helper to restore session
  restoreToken() {
      try {
          const stored = localStorage.getItem('gcal_token');
          if (stored) {
              const token = JSON.parse(stored);
              // Check simplified expiration (approximate)
              // We store 'expires_at' timestamp
              if (Date.now() < token.expires_at) {
                  window.gapi.client.setToken(token);
                  console.log("Token restored from storage");
              } else {
                  localStorage.removeItem('gcal_token'); // Expired
              }
          }
      } catch (e) {
          console.error("Error restoring token", e);
      }
  },

  async login() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) return reject('Token client not initialized');
      
      this.tokenClient.callback = async (resp) => {
        if (resp.error) {
            reject(resp);
            return;
        }
        
        // SAVE TOKEN
        const token = window.gapi.client.getToken();
        if (token) {
            // Add explicit expiration time (expires_in is seconds)
            // Default 3599 seconds usually
            const expiresAt = Date.now() + (token.expires_in * 1000) - 60000; // 1 min buffer
            const tokenToSave = { ...token, expires_at: expiresAt };
            localStorage.setItem('gcal_token', JSON.stringify(tokenToSave));
        }

        resolve(resp);
      };
      
      // Try silent prompt first if possible, or consent if needed. 
      // Sticking to consent for robustness on first login, but future re-auths are manual anyway.
      this.tokenClient.requestAccessToken({prompt: ''}); 
    });
  },

  async logout() {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      localStorage.removeItem('gcal_token'); // Clear storage
    }
  },

  async debugCalendars() {
      try {
          const calListResp = await window.gapi.client.calendar.calendarList.list();
          const calendars = calListResp.result.items;
          let debugInfo = [];
          for (const cal of calendars) {
              let desc = cal.description || "";
              try {
                  const calDetail = await window.gapi.client.calendar.calendars.get({ calendarId: cal.id });
                  if (calDetail.result.description) desc = calDetail.result.description;
              } catch(e) {}
              const parsedDesc = parseBudgetTags(desc);
              const parsedName = parseBudgetTags(cal.summary);
              let ruleSource = "NESSUNA";
              if (parsedDesc) ruleSource = `DA DESCRIZIONE (${parsedDesc.type} €${parsedDesc.amount})`;
              else if (parsedName) ruleSource = `DA NOME (${parsedName.type} €${parsedName.amount})`;
              debugInfo.push({
                  name: cal.summary,
                  description: desc,
                  ruleDetected: ruleSource,
                  id: cal.id
              });
          }
          return debugInfo;
      } catch (e) {
          console.error(e);
          throw e;
      }
  },

  async syncEvents(timeMin, timeMax) {
    try {
      const allTxs = await dbService.getTransactions();
      const manualTxs = allTxs.filter(t => t.source === 'manual');

      const calListResp = await window.gapi.client.calendar.calendarList.list();
      let calendars = calListResp.result.items;

      const start = timeMin || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
      const end = timeMax || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

      let transactions = [];
      let totalEventsScanned = 0;
      let activeRules = []; 
      
      for (const cal of calendars) {
          let description = cal.description;
          try {
              const calDetail = await window.gapi.client.calendar.calendars.get({ calendarId: cal.id });
              if (calDetail.result.description) {
                  description = calDetail.result.description;
              }
          } catch(e) {}

          let calDefaults = parseBudgetTags(description);
          if (!calDefaults) {
              calDefaults = parseBudgetTags(cal.summary);
          }
          
          if (calDefaults) {
              activeRules.push(`${cal.summary}: ${calDefaults.type === 'income' ? 'Entrata' : 'Uscita'} €${calDefaults.amount}`);
          }

          try {
              let pageToken = null;
              do {
                  const eventsResp = await window.gapi.client.calendar.events.list({
                    'calendarId': cal.id,
                    'timeMin': start,
                    'timeMax': end,
                    'showDeleted': false,
                    'singleEvents': true,
                    'maxResults': 2500, 
                    'orderBy': 'startTime',
                    'pageToken': pageToken
                  });
                  
                  const events = eventsResp.result.items;
                  totalEventsScanned += events.length;
                  pageToken = eventsResp.result.nextPageToken;
                  
                  for (const event of events) {
                      if (manualTxs.some(t => t.gcalEventId === event.id)) {
                          continue;
                      }

                      const eventSpecifics = parseBudgetTags(`${event.summary || ''} ${event.description || ''}`);
                      
                      let finalType = 'unclassified';
                      let finalAmount = 0;

                      if (eventSpecifics) {
                          finalType = eventSpecifics.type;
                          finalAmount = eventSpecifics.amount;
                      } else if (calDefaults) {
                          finalType = calDefaults.type;
                          finalAmount = calDefaults.amount;
                      }

                      if (finalType !== 'unclassified' && finalAmount > 0) {
                          transactions.push({
                              id: event.id, 
                              date: event.start.dateTime || event.start.date,
                              amount: finalAmount,
                              type: finalType,
                              description: event.summary || 'Evento senza titolo', 
                              source: 'gcal',
                              gcalEventId: event.id,
                              calendarName: cal.summary
                          });
                      }
                  }
              } while (pageToken);
          } catch (e) {
              console.warn(`Could not read calendar ${cal.summary}`, e);
          }
      }

      await dbService.clearAll();
      
      for (const tx of manualTxs) await dbService.addTransaction(tx);
      for (const tx of transactions) await dbService.addTransaction(tx);
      
      return { 
          totalFound: totalEventsScanned,
          calendarsScanned: calendars.length,
          createdTransactions: transactions.length,
          rules: activeRules
      };

    } catch (err) {
      console.error("Error syncing events", err);
      throw err;
    }
  }
};
