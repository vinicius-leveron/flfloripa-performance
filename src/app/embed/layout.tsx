import '@/app/globals.css';

export const metadata = {
  title: 'Formulário',
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  );
}
