// Contenuti dell'esperienza di costruzione.
// "cap" = dato tratto dai capitolati El.An.; "tip" = valore tipico/indicativo da confermare.

export const FASI = [
  {
    n: '00', titolo: 'Prima', sotto: "L'edificio esistente",
    testo: "Tutto comincia da un immobile che ha esaurito la sua funzione. Ne valutiamo il potenziale, poi lo demoliamo in modo selettivo per ricostruire da zero, con criteri di oggi.",
    tempi: '3–5 settimane',
    materiali: ['Demolizione selettiva', 'Calcestruzzo, laterizio e ferro separati', 'Macerie avviate a recupero'],
    controlli: ['Verifiche e bonifiche preventive', 'Abbattimento delle polveri', 'Monitoraggio degli edifici vicini'],
    numero: ['Da zero', '', 'demolizione e ricostruzione'],
  },
  {
    n: '01', titolo: 'Rilievo e progetto', sotto: 'Il disegno prima del cantiere',
    testo: "Misuriamo il lotto, studiamo il terreno e disegniamo la casa: architettura, strutture e impianti. Poi tracciamo a terra gli allineamenti dei pilastri.",
    tempi: '2–4 mesi tra progetto e permessi',
    materiali: ['Rilievo strumentale', 'Indagine geologica', 'Progetto architettonico, strutturale e impiantistico'],
    controlli: ['Titoli edilizi e vincoli', 'Calcolo strutturale NTC 2018', 'Tracciamento con stazione totale'],
    numero: ['22 × 13', 'm', 'ingombro della palazzina d’esempio'],
  },
  {
    n: '02', titolo: 'Scavo', sotto: 'Lo spazio per il piano interrato',
    testo: "Si scava fino alla quota delle fondazioni. Il terreno viene gestito secondo le norme e i fronti di scavo sono messi in sicurezza.",
    tempi: '2–3 settimane',
    materiali: ['Escavatori e autocarri', 'Gestione di terre e rocce da scavo'],
    controlli: ['Stabilità dei fronti di scavo', 'Verifica della quota di fondo', 'Accessi di cantiere sicuri'],
    numero: ['≈ 1.500', 'm³', 'di terreno movimentato'],
  },
  {
    n: '03', titolo: 'Fondazioni', sotto: 'La base che regge tutto',
    testo: "Uno strato di magrone, poi la gabbia di ferri e il getto della platea in cemento armato. Intorno nascono i muri del piano interrato.",
    tempi: '3–4 settimane',
    materiali: ['Magrone di sottofondazione', 'Platea in cemento armato', 'Acciaio per armature B450C', 'Impermeabilizzazione'],
    controlli: ['Verifica delle armature prima del getto', 'Prelievo di cubetti di calcestruzzo per le prove', 'Tempi di maturazione rispettati'],
    numero: ['≈ 185', 'm³', 'di calcestruzzo in platea'],
  },
  {
    n: '04', titolo: 'Struttura in cemento armato', sotto: 'Lo scheletro antisismico',
    testo: "Pilastri, travi e vano scala salgono un piano alla volta. La struttura è progettata secondo le Norme Tecniche per le Costruzioni 2018.",
    tempi: '≈ 2 settimane per piano',
    materiali: ['Pilastri e travi in c.a.', 'Casseforme', 'Vano scala e ascensore in c.a.'],
    controlli: ['Progetto secondo NTC 2018 (cap.)', 'Verticalità e allineamenti', 'Prelievi a ogni getto', 'Collaudo statico finale'],
    numero: ['NTC', '2018', 'norme per la struttura'],
  },
  {
    n: '05', titolo: 'Solai', sotto: 'I piani su cui vivrai',
    testo: "I solai collegano la struttura e diventano i pavimenti di ogni casa. Restano puntellati finché il calcestruzzo non ha raggiunto la resistenza prevista.",
    tempi: 'in parallelo alla struttura',
    materiali: ['Solai strutturali', 'Rete elettrosaldata', 'Puntelli'],
    controlli: ['Carichi e spessori di progetto', 'Planarità', 'Disarmo nei tempi corretti'],
    numero: ['6', '', 'solai, dal piano terra alla copertura'],
  },
  {
    n: '06', titolo: 'Tamponature', sotto: 'Le pareti che proteggono',
    testo: "Le pareti esterne in termolaterizio chiudono l'edificio. Tra un alloggio e l'altro una doppia parete con lana di roccia riduce i rumori.",
    tempi: '6–8 settimane',
    materiali: ['Termolaterizio da 30 cm (cap.)', 'Doppia tramezzatura tra alloggi (cap.)', 'Lana di roccia da 6 cm (cap.)'],
    controlli: ['Allineamenti e piombi', 'Ponti termici attorno alle aperture', 'Continuità dell’isolamento acustico'],
    numero: ['30', 'cm', 'di termolaterizio'],
  },
  {
    n: '07', titolo: 'Impianti', sotto: 'Quello che non si vede',
    testo: "Acqua, scarichi, elettricità e climatizzazione passano nelle pareti e nei solai prima delle finiture. Per questo li controlliamo e li proviamo prima di chiudere.",
    tempi: '8–10 settimane',
    materiali: ['Pompa di calore (cap.)', 'Split nei vani principali (cap.)', 'Bollitore da 190 litri con recupero di calore (cap.)', 'Videocitofono (cap.)'],
    controlli: ['Prove di tenuta delle tubazioni', 'Dichiarazioni di conformità', 'Verifiche dell’impianto elettrico'],
    numero: ['190', 'litri', 'di acqua calda sanitaria'],
  },
  {
    n: '08', titolo: 'Copertura', sotto: "Il tetto e l'energia",
    testo: "Il tetto viene isolato e impermeabilizzato. Sopra trova posto l'impianto fotovoltaico condominiale, che alimenta i servizi comuni.",
    tempi: '3–4 settimane',
    materiali: ['Isolamento e impermeabilizzazione', 'Fotovoltaico condominiale da 10 kW (cap.)', 'Parapetti e lattonerie'],
    controlli: ['Prova di tenuta all’acqua', 'Pendenze e scarichi', 'Sicurezza per la manutenzione'],
    numero: ['10', 'kW', 'di fotovoltaico condominiale'],
  },
  {
    n: '09', titolo: 'Facciata e serramenti', sotto: "L'abito dell'edificio",
    testo: "Il cappotto termico avvolge l'edificio, poi arrivano finestre, balconi e parapetti. È la fase in cui la casa prende il suo aspetto definitivo.",
    tempi: '6–8 settimane',
    materiali: ['Cappotto termico da 10 cm (cap.)', 'Infissi in PVC con vetrocamera basso emissivo (cap.)', 'Cassonetti coibentati e avvolgibili elettrici (cap.)'],
    controlli: ['Posa dei serramenti a regola d’arte', 'Continuità del cappotto', 'Smontaggio sicuro dei ponteggi'],
    numero: ['10', 'cm', 'di cappotto termico'],
  },
  {
    n: '10', titolo: 'Finiture interne', sotto: 'La casa diventa tua',
    testo: "Pavimenti, porte, bagni e cucina. Entro i limiti del capitolato puoi scegliere porte interne, rivestimenti, sanitari e rubinetteria.",
    tempi: '8–10 settimane',
    materiali: ['Pavimenti in gres porcellanato (cap.)', 'Porte interne a scelta (cap.)', 'Sanitari e rubinetteria a scelta (cap.)'],
    controlli: ['Varianti verificate e preventivate', 'Controllo stanza per stanza', 'Pulizia finale'],
    numero: ['4', '', 'scelte personalizzabili'],
  },
  {
    n: '11', titolo: 'Consegna delle chiavi', sotto: 'Benvenuto a casa',
    testo: "Collaudi, certificazioni e un sopralluogo insieme a te. Poi le chiavi, con tutti i documenti della tua casa.",
    tempi: 'il giorno che aspettavi',
    materiali: ['Ascensore accessibile (cap.)', 'Portoncino blindato (cap.)', 'Spazi esterni secondo progetto'],
    controlli: ['Collaudo statico', 'Certificazioni degli impianti', 'Sopralluogo con il cliente'],
    numero: ['1', '', 'referente, dalla prima visita alle chiavi'],
  },
];

// Stratigrafie: cosa c'è dentro ogni elemento. Spessori in cm.
export const ELEMENTI = {
  fondazione: {
    nome: 'Fondazione a platea', desc: 'Una piastra continua in cemento armato distribuisce il peso dell’edificio sul terreno.',
    strati: [['Impermeabilizzazione', 0.5, 'tip'], ['Platea in cemento armato', 60, 'tip'], ['Magrone di pulizia', 10, 'tip'], ['Terreno di fondazione', 0, 'tip']],
  },
  pilastro: {
    nome: 'Pilastro in cemento armato', desc: 'Struttura progettata secondo le NTC 2018 per resistere ai carichi e al sisma.',
    strati: [['Copriferro', 3, 'tip'], ['Staffe e barre in acciaio B450C', 4, 'tip'], ['Nucleo in calcestruzzo strutturale', 23, 'tip'], ['Barre e staffe', 4, 'tip'], ['Copriferro', 3, 'tip']],
    note: 'Sezione d’esempio 30 × 50 cm. Classi dei materiali da progetto strutturale.',
  },
  solaio: {
    nome: 'Solaio interpiano', desc: 'Dal pavimento al soffitto del piano sotto: struttura, isolamento acustico e finitura.',
    strati: [['Pavimento in gres porcellanato', 1, 'cap'], ['Massetto', 5, 'tip'], ['Isolante anticalpestio', 1, 'tip'], ['Sottofondo per impianti', 8, 'tip'], ['Solaio strutturale', 25, 'tip'], ['Intonaco', 1.5, 'tip']],
  },
  parete: {
    nome: 'Parete esterna', desc: 'Il "pacchetto" che separa la casa dall’esterno e limita le dispersioni di calore.',
    strati: [['Finitura e rasatura esterna', 0.5, 'tip'], ['Cappotto termico', 10, 'cap'], ['Termolaterizio', 30, 'cap'], ['Intonaco interno', 1.5, 'tip']],
  },
  tramezzo: {
    nome: 'Parete tra alloggi', desc: 'Doppia parete con isolante in mezzo, per un buon comfort acustico tra vicini.',
    strati: [['Intonaco', 1.5, 'tip'], ['Laterizio', 8, 'tip'], ['Lana di roccia', 6, 'cap'], ['Laterizio', 8, 'tip'], ['Intonaco', 1.5, 'tip']],
    note: 'Doppia tramezzatura e lana di roccia da 6 cm come da capitolato.',
  },
  serramento: {
    nome: 'Serramento', desc: 'Finestre e porte-finestre pensate per isolare dal caldo, dal freddo e dai rumori.',
    strati: [['Infisso in PVC', 0, 'cap'], ['Vetrocamera basso emissivo', 0, 'cap'], ['Cassonetto coibentato', 0, 'cap'], ['Avvolgibile elettrico', 0, 'cap']],
  },
  balcone: {
    nome: 'Balcone', desc: 'Lo spazio all’aperto di ogni appartamento ai piani.',
    strati: [['Pavimentazione esterna', 1, 'tip'], ['Impermeabilizzazione', 0.5, 'tip'], ['Soletta in cemento armato', 20, 'tip'], ['Parapetto', 0, 'tip']],
    note: 'Finiture e parapetti variano per progetto.',
  },
  copertura: {
    nome: 'Copertura piana', desc: 'Il tetto isolato e impermeabilizzato che ospita il fotovoltaico condominiale.',
    strati: [['Pavimentazione di protezione', 2, 'tip'], ['Impermeabilizzazione', 1, 'tip'], ['Isolante termico', 12, 'tip'], ['Massetto delle pendenze', 6, 'tip'], ['Solaio strutturale', 25, 'tip']],
  },
  fotovoltaico: {
    nome: 'Fotovoltaico condominiale', desc: 'Impianto da 10 kW per i servizi comuni: luci delle scale, ascensore, citofoni e illuminazione esterna.',
    strati: [['Pannelli fotovoltaici', 0, 'cap'], ['Strutture di supporto', 0, 'tip'], ['Inverter e quadro', 0, 'tip']],
    note: 'Serve i carichi condominiali, non i singoli appartamenti.',
  },
  impianti: {
    nome: 'Impianti', desc: 'Climatizzazione, acqua calda ed elettricità, verificati prima di chiudere le pareti.',
    strati: [['Pompa di calore per caldo e freddo', 0, 'cap'], ['Split nei vani principali', 0, 'cap'], ['Bollitore da 190 litri con recupero di calore', 0, 'cap'], ['Termoarredi elettrici nei bagni', 0, 'cap']],
  },
  finiture: {
    nome: 'Finiture interne', desc: 'Le scelte che rendono la casa tua, entro i limiti economici del capitolato.',
    strati: [['Pavimenti in gres porcellanato', 0, 'cap'], ['Porte interne a scelta', 0, 'cap'], ['Rivestimenti a scelta', 0, 'cap'], ['Sanitari e rubinetteria a scelta', 0, 'cap']],
    note: 'Varianti murarie ed elettriche soggette a verifica tecnica e preventivo.',
  },
};

export const ALIAS = { pavimento: 'finiture', arredo: 'finiture', 'facciata-oro': 'parete' };
export const ORDINE_ELEMENTI = ['fondazione', 'pilastro', 'solaio', 'parete', 'tramezzo', 'impianti', 'copertura', 'fotovoltaico', 'serramento', 'balcone', 'finiture'];
