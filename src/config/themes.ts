export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  styles: {
    borderRadius: string
    boxShadow: string
    buttonStyle: string
  }
}

export const themes: Theme[] = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean and contemporary design with subtle shadows and rounded corners',
    colors: {
      primary: '#4F46E5',
      secondary: '#818CF8',
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#F59E0B',
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
    styles: {
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      buttonStyle: 'rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700',
    },
  },
  {
    id: 'elegant',
    name: 'Elegant Classic',
    description: 'Sophisticated design with serif fonts and subtle gradients',
    colors: {
      primary: '#1F2937',
      secondary: '#4B5563',
      background: '#F9FAFB',
      text: '#111827',
      accent: '#9CA3AF',
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif',
    },
    styles: {
      borderRadius: '0.25rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      buttonStyle: 'rounded-sm bg-gray-900 text-white px-4 py-2 hover:bg-gray-800',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant Energy',
    description: 'Bold and energetic design with bright colors and strong contrasts',
    colors: {
      primary: '#EC4899',
      secondary: '#F472B6',
      background: '#FDF2F8',
      text: '#831843',
      accent: '#FCD34D',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Poppins, sans-serif',
    },
    styles: {
      borderRadius: '1rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      buttonStyle: 'rounded-full bg-pink-600 text-white px-6 py-3 hover:bg-pink-700',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate Professional',
    description: 'Professional and trustworthy design with a focus on readability',
    colors: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      background: '#F8FAFC',
      text: '#0F172A',
      accent: '#64748B',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    styles: {
      borderRadius: '0.375rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      buttonStyle: 'rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700',
    },
  },
] 