import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Sage Green palette
        primary: {
          50: '#F1F3E0',   // Lightest cream
          100: '#E8EBD3',
          200: '#D2DCB6',  // Light sage
          300: '#BDCDA7',
          400: '#A1BC98',  // Medium sage
          500: '#8DAA84',
          600: '#778873',  // Dark sage
          700: '#5F6E5C',
          800: '#475347',
          900: '#2F372F',
        },
        // Secondary - Warm olive tones
        secondary: {
          50: '#F7F6F0',
          100: '#ECEADC',
          200: '#DED9C3',
          300: '#C9C1A5',
          400: '#B3A889',
          500: '#9D8F6F',
          600: '#847758',
          700: '#6B6048',
          800: '#524939',
          900: '#3A332A',
        },
        // Accent - Soft moss/teal
        accent: {
          50: '#EEF4F2',
          100: '#D9E8E4',
          200: '#B8D4CC',
          300: '#93BDB1',
          400: '#6FA596',
          500: '#528B7A',
          600: '#3F7062',
          700: '#32594F',
          800: '#26433C',
          900: '#1A2D29',
        },
        // Neutral - Warm gray-green
        neutral: {
          50: '#F8F9F6',
          100: '#F1F3EE',
          200: '#E2E6DD',
          300: '#CDD3C5',
          400: '#A4AC9B',
          500: '#7B8573',
          600: '#5E665A',
          700: '#454C42',
          800: '#2D322B',
          900: '#171A16',
        },
        // Success - Natural green
        success: {
          50: '#F0F6F0',
          100: '#DCEBDC',
          200: '#B9D7B9',
          300: '#8FC08F',
          400: '#65A365',
          500: '#4A8A4A',
          600: '#3B6E3B',
        },
        // Warning - Warm amber
        warning: {
          50: '#FDF8EE',
          100: '#FAEED4',
          200: '#F5DBA8',
          300: '#EFC477',
          400: '#E6A944',
          500: '#D4901F',
          600: '#B17518',
        },
        // Error - Soft terracotta
        error: {
          50: '#FDF5F3',
          100: '#FAE8E4',
          200: '#F5CEC6',
          300: '#EDA99C',
          400: '#E07E6D',
          500: '#C95D4B',
          600: '#A64839',
        },
        // Glass background
        glass: {
          light: 'rgba(241, 243, 224, 0.8)',
          dark: 'rgba(241, 243, 224, 0.95)',
        },
        // Sage palette direct access
        sage: {
          cream: '#F1F3E0',
          light: '#D2DCB6',
          medium: '#A1BC98',
          dark: '#778873',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'sans-serif'],
        hyperlegible: ['Atkinson Hyperlegible', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.05' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(119, 136, 115, 0.12), 0 10px 20px -2px rgba(119, 136, 115, 0.08)',
        'card': '0 4px 20px -2px rgba(119, 136, 115, 0.1), 0 2px 8px -2px rgba(119, 136, 115, 0.06)',
        'elevated': '0 10px 40px -10px rgba(119, 136, 115, 0.2), 0 2px 10px -2px rgba(119, 136, 115, 0.08)',
        'glow-sage': '0 0 40px -10px rgba(161, 188, 152, 0.5)',
        'glow-olive': '0 0 40px -10px rgba(119, 136, 115, 0.4)',
        'glow-moss': '0 0 40px -10px rgba(82, 139, 122, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(161, 188, 152, 0.1)',
        // Legacy aliases
        'glow-purple': '0 0 40px -10px rgba(161, 188, 152, 0.5)',
        'glow-pink': '0 0 40px -10px rgba(119, 136, 115, 0.4)',
        'glow-cyan': '0 0 40px -10px rgba(82, 139, 122, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #A1BC98 0%, #778873 100%)',
        'sage-mesh': 'linear-gradient(135deg, rgba(161, 188, 152, 0.15) 0%, rgba(210, 220, 182, 0.1) 50%, rgba(119, 136, 115, 0.15) 100%)',
        // Legacy alias
        'purple-mesh': 'linear-gradient(135deg, rgba(161, 188, 152, 0.15) 0%, rgba(210, 220, 182, 0.1) 50%, rgba(119, 136, 115, 0.15) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'gradient-x': 'gradientX 3s ease infinite',
        'waveform': 'waveform 1s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
