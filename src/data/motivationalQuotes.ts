// Motivational quotes for daily inspiration
// Each quote has a calm gradient background for visual appeal

export interface MotivationalQuote {
  quote: string
  author: string
  gradient: string // CSS gradient string
}

export const motivationalQuotes: MotivationalQuote[] = [
  {
    quote: "Peace comes from within. Do not seek it without.",
    author: "Buddha",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  {
    quote: "The present moment is the only time over which we have dominion.",
    author: "Thich Nhat Hanh",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
  },
  {
    quote: "You are the sky. Everything else is just the weather.",
    author: "Pema Chödrön",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
  },
  {
    quote: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
  },
  {
    quote: "Mindfulness is about being fully awake in our lives.",
    author: "Jon Kabat-Zinn",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
  },
  {
    quote: "The best way to take care of the future is to take care of the present moment.",
    author: "Thich Nhat Hanh",
    gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
  },
  {
    quote: "Wherever you are, be there totally.",
    author: "Eckhart Tolle",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
  },
  {
    quote: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts and our feelings.",
    author: "Arianna Huffington",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"
  },
  {
    quote: "The mind is everything. What you think you become.",
    author: "Buddha",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
  },
  {
    quote: "Be where you are; otherwise you will miss your life.",
    author: "Buddha",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
  },
  {
    quote: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
    author: "Thich Nhat Hanh",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
  },
  {
    quote: "The quieter you become, the more you can hear.",
    author: "Ram Dass",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
  },
  {
    quote: "You have been assigned this mountain to show others it can be moved.",
    author: "Mel Robbins",
    gradient: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"
  },
  {
    quote: "Every breath we take, every step we make, can be filled with peace, joy, and serenity.",
    author: "Thich Nhat Hanh",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
  },
  {
    quote: "The only way out is through.",
    author: "Robert Frost",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  }
]

/**
 * Get a random quote from the collection
 */
export const getRandomQuote = (): MotivationalQuote => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
}

/**
 * Shuffle array and return it (Fisher-Yates shuffle)
 */
export const shuffleQuotes = (quotes: MotivationalQuote[]): MotivationalQuote[] => {
  const shuffled = [...quotes]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

