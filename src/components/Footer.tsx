import React, { useState } from 'react';
import { Heart, Github } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import qrcodePix from '@/assets/qrcode-cnpj-pix.png';

const SUGGESTED_AMOUNTS = [5, 10, 20, 50, 100];
const PIX_CNPJ_RAW = '58669291000195';

interface FooterProps {
  variant?: 'default' | 'sidebar';
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ variant = 'default', className = '' }) => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const copyCnpjToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CNPJ_RAW);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = PIX_CNPJ_RAW;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  const isSidebar = variant === 'sidebar';

  return (
    <>
      <footer
        className={
          isSidebar
            ? `shrink-0 border-t border-border p-4 space-y-3 ${className}`
            : `fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/80 backdrop-blur-md py-2 sm:py-3 ${className}`
        }
      >
        <div className={isSidebar ? 'space-y-3' : 'container flex items-center justify-between gap-2 sm:gap-3'}>
          <div className={isSidebar ? 'space-y-2' : 'flex items-center gap-2 min-w-0'}>
            <p className={`text-xs text-muted-foreground ${isSidebar ? '' : 'hidden sm:block truncate'}`}>
              Genea — preserve a história da sua família
            </p>
            {!isSidebar && (
              <p className="sm:hidden text-[11px] text-muted-foreground truncate">Genea</p>
            )}
            <a
              href="https://github.com/tactiago/genea-family-tree"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-muted-foreground/70 hover:text-muted-foreground transition-colors ${
                isSidebar ? 'inline-flex items-center gap-1.5 text-xs' : 'shrink-0 p-1'
              }`}
              aria-label="Código fonte no GitHub"
            >
              <Github className={isSidebar ? 'h-4 w-4' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} />
              {isSidebar && <span>GitHub</span>}
            </a>
          </div>
          <button
            onClick={() => setShowDonationModal(true)}
            className={
              isSidebar
                ? 'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary border border-primary/40 hover:bg-primary/5 transition-colors'
                : 'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/40 hover:bg-primary/5 transition-colors sm:gap-2 sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm'
            }
          >
            <Heart className={`fill-primary ${isSidebar ? 'h-4 w-4' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'}`} />
            {isSidebar ? (
              <span>Apoiar com doação</span>
            ) : (
              <>
                <span className="hidden sm:inline">Apoiar com doação</span>
                <span className="sm:hidden">Apoiar</span>
              </>
            )}
          </button>
        </div>
      </footer>

      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              Apoie a preservação da história familiar
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-center space-y-4 pt-2">
                <p className="text-foreground">
                  Cada família tem uma história única. Com sua ajuda, continuamos oferecendo
                  gratuitamente esta ferramenta para que gerações presentes e futuras possam
                  mapear suas origens, celebrar suas raízes e manter viva a memória de quem
                  veio antes de nós.
                </p>
                <p className="text-sm">
                  Faça sua doação via Pix no valor que preferir. Escaneie o QR Code abaixo
                  ou use a chave CNPJ:{' '}
                  <button
                    type="button"
                    onClick={copyCnpjToClipboard}
                    className="font-semibold underline decoration-primary/50 underline-offset-2 hover:decoration-primary transition-colors cursor-pointer"
                    title="Clique para copiar"
                  >
                    58.669.291/0001-95
                  </button>
                  {copiedFeedback && (
                    <span className="ml-1.5 text-xs text-primary font-medium">✓ Copiado!</span>
                  )}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 pt-2">
            <p className="text-sm font-medium text-muted-foreground">
              Sugestões de valor (escolha o que desejar):
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amount);
                    copyCnpjToClipboard();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAmount === amount
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  R$ {amount}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Você define o valor na hora de pagar. Os valores acima são apenas sugestões.
            </p>

            <div className="p-4 bg-white rounded-xl">
              <img
                src={qrcodePix}
                alt="QR Code para doação via Pix"
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Chave Pix (CNPJ):{' '}
              <button
                type="button"
                onClick={copyCnpjToClipboard}
                className="font-medium underline decoration-primary/50 underline-offset-2 hover:decoration-primary transition-colors cursor-pointer"
                title="Clique para copiar"
              >
                58.669.291/0001-95
              </button>
              {copiedFeedback && (
                <span className="ml-1 text-primary font-medium">✓ Copiado!</span>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
