import { JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import Header from '@/components/Layout/Header';
import { CompareProvider } from '@/lib/CompareContext';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--next-font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'ondeviveremsp — onde morar em São Paulo',
  description:
    'Compare bairros de SP pelo custo total real — aluguel, transporte e estilo de vida.',
};

const initThemeScript = `
(function(){try{
  var saved=localStorage.getItem('ondeviveremsp-theme');
  var t=saved||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      className={`${GeistSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: initThemeScript }} />
      </head>
      <body>
        <CompareProvider>
          <Header />
          <main>{children}</main>
        </CompareProvider>
      </body>
    </html>
  );
}
