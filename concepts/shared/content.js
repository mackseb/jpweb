/*
 * Shared site content for all three concepts.
 * Everything here is PLACEHOLDER content (name, quotes, dates, venues) until
 * the real material arrives. Strings are either plain text (same in both
 * languages) or { de, en } pairs.
 */
window.SITE = {
  first: "Maria",
  last: "Muster",
  voice: { de: "Sopran", en: "Soprano" },
  genres: { de: "Oper · Konzert · Lied", en: "Opera · Concert · Song" },
  claim: {
    de: "Lyrischer Sopran für Opernbühne, Oratorium und Liederabend.",
    en: "Lyric soprano for the opera stage, oratorio and song recital."
  },

  email: "booking@example.com",
  phone: "+49 000 000 00 00",
  agency: {
    de: "Vertretung: Platzhalter-Agentur, Musterstadt",
    en: "Represented by: Placeholder Agency, Sample City"
  },
  bookingFor: {
    de: "Opernproduktionen, Konzerte und Oratorien, Galas, Liederabende und private Anlässe.",
    en: "Opera productions, concerts and oratorios, galas, song recitals and private events."
  },

  // demo = index of the synthesized placeholder melody in demo-audio.js
  tracks: [
    {
      composer: "W. A. Mozart",
      title: { de: "„Porgi, amor“", en: "“Porgi, amor”" },
      work: { de: "Le nozze di Figaro · Gräfin", en: "Le nozze di Figaro · Countess" },
      demo: 0
    },
    {
      composer: "Franz Schubert",
      title: { de: "„Nacht und Träume“", en: "“Nacht und Träume”" },
      work: { de: "Lied, D 827", en: "Song, D 827" },
      demo: 1
    },
    {
      composer: "G. F. Händel",
      title: { de: "„Rejoice greatly“", en: "“Rejoice greatly”" },
      work: { de: "Messiah · Sopran-Arie", en: "Messiah · soprano aria" },
      demo: 2
    }
  ],

  videos: [
    {
      title: { de: "Liederabend, Ausschnitt", en: "Song recital, excerpt" },
      meta: "R. Schumann · Frauenliebe und -leben",
      duration: "6:12"
    },
    {
      title: { de: "Operngala, Arie der Musetta", en: "Opera gala, Musetta's waltz" },
      meta: "G. Puccini · La Bohème",
      duration: "3:48"
    }
  ],

  repertoire: {
    opera: [
      { role: "Pamina", work: "Die Zauberflöte", composer: "Mozart" },
      { role: { de: "Gräfin Almaviva", en: "Countess Almaviva" }, work: "Le nozze di Figaro", composer: "Mozart" },
      { role: "Fiordiligi", work: "Così fan tutte", composer: "Mozart" },
      { role: "Agathe", work: "Der Freischütz", composer: "Weber" },
      { role: "Gretel", work: "Hänsel und Gretel", composer: "Humperdinck" },
      { role: "Micaëla", work: "Carmen", composer: "Bizet" },
      { role: "Mimì", work: "La Bohème", composer: "Puccini" },
      { role: "Rosalinde", work: "Die Fledermaus", composer: "J. Strauss" }
    ],
    concert: [
      { work: { de: "Matthäus-Passion", en: "St Matthew Passion" }, composer: "J. S. Bach" },
      { work: "Messiah", composer: "G. F. Händel" },
      { work: { de: "Die Schöpfung", en: "The Creation" }, composer: "J. Haydn" },
      { work: "Requiem KV 626", composer: "W. A. Mozart" },
      { work: "Ein deutsches Requiem", composer: "J. Brahms" },
      { work: { de: "Elias", en: "Elijah" }, composer: "F. Mendelssohn" },
      { work: "Carmina Burana", composer: "C. Orff" }
    ],
    lied: [
      { work: "Frauenliebe und -leben", composer: "R. Schumann" },
      { work: { de: "Vier letzte Lieder", en: "Four Last Songs" }, composer: "R. Strauss" },
      { work: { de: "Ausgewählte Lieder", en: "Selected songs" }, composer: "F. Schubert" },
      { work: "Les nuits d’été", composer: "H. Berlioz" },
      { work: { de: "Mädchenlieder", en: "Songs of girlhood" }, composer: "J. Brahms" }
    ]
  },

  // ISO dates; the pages format them per language
  dates: [
    { date: "2026-11-14", work: "Messiah", composer: "G. F. Händel", role: { de: "Sopran-Solo", en: "Soprano solo" }, venue: "Stadtkirche Musterstadt" },
    { date: "2026-12-06", work: { de: "Weihnachtsoratorium", en: "Christmas Oratorio" }, composer: "J. S. Bach", role: { de: "Sopran-Solo", en: "Soprano solo" }, venue: "Dom zu Beispielstadt" },
    { date: "2027-01-23", work: { de: "Neujahrsgala", en: "New Year’s Gala" }, composer: { de: "Arien und Duette", en: "Arias and duets" }, role: "", venue: "Kurhaus Musterbad" },
    { date: "2027-03-12", work: "Die Zauberflöte", composer: "W. A. Mozart", role: "Pamina", venue: "Stadttheater Musterstadt" },
    { date: "2027-05-02", work: { de: "Liederabend", en: "Song recital" }, composer: "Schumann · Strauss", role: "", venue: "Kammermusiksaal Beispielstadt" }
  ],
  pastVenues: [
    "Stadttheater Musterstadt",
    "Philharmonie Beispielstadt",
    "Festival Musterland",
    "Dom zu Beispielstadt",
    "Kurhaus Musterbad",
    "Konzerthaus Probestadt"
  ],

  press: [
    {
      quote: {
        de: "Eine Stimme von leuchtender Klarheit, die selbst im leisesten Piano den ganzen Saal erreicht.",
        en: "A voice of radiant clarity that reaches the whole hall even in the softest pianissimo."
      },
      source: { de: "Beispiel-Zeitung", en: "Sample Gazette" }
    },
    {
      quote: {
        de: "Ihre Pamina war das Herz des Abends: schlicht, innig und mit großem Atem gesungen.",
        en: "Her Pamina was the heart of the evening: simple, intimate and sung with great breadth."
      },
      source: { de: "Musterstädter Rundschau", en: "Sample City Review" }
    },
    {
      quote: {
        de: "Textverständlichkeit und Legato, wie man sie im Liedgesang selten hört.",
        en: "Diction and legato of a kind rarely heard in song recitals."
      },
      source: { de: "Platzhalter-Magazin", en: "Placeholder Magazine" }
    }
  ],

  bio: [
    {
      de: "Maria Muster ist lyrischer Sopran mit Schwerpunkt auf Mozart, dem deutschen Lied und dem Oratorium. Sie studierte Gesang an der Hochschule für Musik Beispielstadt und gehörte zwei Spielzeiten dem Ensemble des Stadttheaters Musterstadt an.",
      en: "Maria Muster is a lyric soprano with a focus on Mozart, German song and oratorio. She studied voice at the Beispielstadt University of Music and spent two seasons as an ensemble member at the Musterstadt municipal theatre."
    },
    {
      de: "Hier steht später ihre eigene Biografie: kurz genug für ein Programmheft und lang genug, um neugierig zu machen.",
      en: "Her own biography goes here later: short enough for a programme booklet and long enough to make people curious."
    }
  ],
  highlights: [
    { year: "2025", text: { de: "Preisträgerin, Internationaler Gesangswettbewerb (Platzhalter)", en: "Prize winner, international singing competition (placeholder)" } },
    { year: "2022–24", text: { de: "Ensemblemitglied, Stadttheater Musterstadt", en: "Ensemble member, Musterstadt municipal theatre" } },
    { year: "2021", text: { de: "Master Gesang, Hochschule für Musik Beispielstadt", en: "MMus Voice, Beispielstadt University of Music" } },
    { year: "2020", text: { de: "Meisterkurs Lied (Platzhalter)", en: "Song masterclass (placeholder)" } }
  ],
  presskit: [
    { de: "Vita (PDF)", en: "CV (PDF)" },
    { de: "Biografie, kurz und lang", en: "Biography, short and long" },
    { de: "Pressefotos, hochauflösend", en: "Press photos, high resolution" },
    { de: "Repertoireliste", en: "Repertoire list" }
  ]
};
