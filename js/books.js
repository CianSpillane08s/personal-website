/*
  Your bookshelf. This one file feeds the Books page and the idea map.

  To write about a book, put your thoughts between the backticks in `notes`.
  You can use plain text or HTML, and leave a blank line between paragraphs.

  status:  "read" | "reading" | "next"
  themes:  any of the keys in THEMES below (they become the words on the map)
  rating:  1–5, or leave it out
  cover:   path to an image in /covers, or leave it out for a plain text cover
*/

window.THEMES = {            // the order here is the order around the map
  startups:   "Startups",
  ai:         "Generative AI",
  disruption: "Disruption",
  growth:     "Growth & macro",
  markets:    "Markets",
  mind:       "Mind & work",
};

window.BOOKS = [
  // ---------- reading now ----------
  {
    id: "power-of-creative-destruction",
    title: "The Power of Creative Destruction",
    author: "Philippe Aghion, Céline Antonin & Simon Bunel",
    status: "reading",
    themes: ["growth", "disruption"],
    cover: "covers/creative-destruction.jpg",
    notes: ``,
  },

  // ---------- read ----------
  {
    id: "man-who-solved-the-market",
    title: "The Man Who Solved the Market",
    author: "Gregory Zuckerman",
    status: "read",
    themes: ["markets", "ai"],
    cover: "covers/man-who-solved-the-market.jpg",
    notes: ``,
  },
  {
    id: "deep-work",
    title: "Deep Work",
    author: "Cal Newport",
    status: "read",
    themes: ["mind"],
    cover: "covers/deep-work.jpg",
    notes: ``,
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    status: "read",
    themes: ["mind"],
    cover: "covers/atomic-habits.jpg",
    notes: ``,
  },
  {
    id: "psychology-of-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    status: "read",
    themes: ["markets", "mind"],
    cover: "covers/psychology-of-money.jpg",
    notes: ``,
  },
  {
    id: "4-disciplines-of-execution",
    title: "The 4 Disciplines of Execution",
    author: "Chris McChesney, Sean Covey & Jim Huling",
    status: "read",
    themes: ["mind", "startups"],
    cover: "covers/4dx.jpg",
    notes: ``,
  },
  {
    id: "thinking-machine",
    title: "The Thinking Machine",
    author: "Stephen Witt",
    status: "read",
    themes: ["ai", "disruption", "startups"],
    cover: "covers/thinking-machine.jpg",
    notes: ``,
  },
  {
    id: "little-history-of-economics",
    title: "A Little History of Economics",
    author: "Niall Kishtainy",
    status: "read",
    themes: ["growth"],
    cover: "covers/little-history-economics.jpg",
    notes: ``,
  },
  {
    id: "elon-musk",
    title: "Elon Musk",
    author: "Ashlee Vance",
    status: "read",
    themes: ["startups", "disruption"],
    cover: "covers/elon-musk.jpg",
    notes: ``,
  },
  {
    id: "zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel",
    status: "read",
    themes: ["startups", "disruption"],
    cover: "covers/zero-to-one.jpg",
    notes: ``,
  },

  // ---------- up next ----------
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    status: "next",
    themes: ["mind"],
    cover: "covers/meditations.jpg",
    notes: ``,
  },
  {
    id: "thinking-fast-and-slow",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    status: "next",
    themes: ["mind", "markets"],
    cover: "covers/thinking-fast-slow.jpg",
    notes: ``,
  },
  {
    id: "trading-game",
    title: "The Trading Game",
    author: "Gary Stevenson",
    status: "next",
    themes: ["markets", "growth"],
    cover: "covers/trading-game.jpg",
    notes: ``,
  },
  {
    id: "alchemists",
    title: "The Alchemists",
    author: "Neil Irwin",
    status: "next",
    themes: ["growth", "markets"],
    cover: "covers/alchemists.jpg",
    notes: ``,
  },
  {
    id: "lean-startup",
    title: "The Lean Startup",
    author: "Eric Ries",
    status: "next",
    themes: ["startups"],
    cover: "covers/lean-startup.jpg",
    notes: ``,
  },
  {
    id: "innovators-dilemma",
    title: "The Innovator's Dilemma",
    author: "Clayton M. Christensen",
    status: "next",
    themes: ["disruption", "startups"],
    cover: "covers/innovators-dilemma.jpg",
    notes: ``,
  },
];
