export interface Lesson {
  id: string;
  title: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  vocabulary: string[];
  phrases: string[];
}

export const lessons: Lesson[] = [
  {
    id: 'greetings',
    title: 'Grüße und Vorstellungen',
    topic: 'Alltagskommunikation',
    level: 'A1',
    vocabulary: ['Hallo', 'Auf Wiedersehen', 'Wie geht\'s?', 'Danke', 'Bitte', 'Ich heiße...'],
    phrases: [
      'Guten Morgen!', 'Guten Tag!', 'Guten Abend!',
      'Wie geht es Ihnen?', 'Wie heißt du?', 'Woher kommst du?'
    ]
  },
  {
    id: 'food',
    title: 'Essen und Trinken',
    topic: 'Alltagskommunikation',
    level: 'A1',
    vocabulary: ['Essen', 'Trinken', 'Restaurant', 'Bestellen', 'Rechnung', 'Lecker'],
    phrases: [
      'Ich möchte bestellen.',
      'Was können Sie empfehlen?',
      'Die Rechnung, bitte.',
      'Das Essen ist sehr lecker.',
    ]
  },
  {
    id: 'travel',
    title: 'Reisen und Verkehr',
    topic: 'Unterwegs',
    level: 'A2',
    vocabulary: ['Zug', 'Flugzeug', 'Bahnhof', 'Flughafen', 'Ticket', 'Koffer'],
    phrases: [
      'Wo ist der Bahnhof?',
      'Ich brauche ein Ticket nach Berlin.',
      'Wann fährt der nächste Zug?',
      'Von welchem Gleis fährt der Zug ab?',
    ]
  }
];
