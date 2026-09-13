import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        ajax: {
          red: '#D2122E',
          'red-dark': '#A50E24',
          black: '#0A0A0A',
          gray: '#1A1A1A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 16px rgba(0,0,0,0.10)'
      }
    }
  },
  plugins: []
}
