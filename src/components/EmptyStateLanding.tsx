import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, TreePine, Users, FileJson, Shield, Smartphone, Sparkles, TreeDeciduous, ArrowRight } from 'lucide-react';
import geneaLogo from '@/assets/genea-logo.webp';

interface EmptyStateLandingProps {
  onAddPerson: () => void;
  onImport: () => void;
  onViewExample: () => void;
  onGoToTree?: () => void;
}

const steps = [
  {
    icon: Plus,
    title: 'Adicione as primeiras pessoas',
    description: 'Comece por você ou por um ancestral. Nome, datas de nascimento e fotos.',
  },
  {
    icon: Users,
    title: 'Conecte a família',
    description: 'Vincule pais, filhos e cônjuges. A árvore cresce conforme você adiciona.',
  },
  {
    icon: TreePine,
    title: 'Visualize e exporte',
    description: 'Veja sua árvore, a linha do tempo e exporte em JSON para guardar ou compartilhar.',
  },
];

const EmptyStateLanding: React.FC<EmptyStateLandingProps> = ({ onAddPerson, onImport, onViewExample, onGoToTree }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="flex justify-center mb-2">
            <motion.img
              src={geneaLogo}
              alt="Genea"
              className="h-60 w-60 drop-shadow-sm"
              fetchPriority="high"
              loading="eager"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Sua árvore genealógica,
            <br />
            <span className="text-primary">simples e gratuita</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Crie e visualize a história da sua família em minutos. Sem cadastro, sem complicação.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col gap-3 justify-center items-center"
          >
            {onGoToTree && (
              <button
                onClick={onGoToTree}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <TreeDeciduous className="h-5 w-5" />
                Ir para minha árvore
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={onAddPerson}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="h-5 w-5" />
                Começar — adicionar primeira pessoa
              </button>
              <button
                onClick={onImport}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-all"
              >
                <Upload className="h-4 w-4" />
                Já tenho dados — importar JSON
              </button>
            </div>
            <button
              onClick={onViewExample}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Ver exemplo (família Potter)
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/50 py-12 px-4">
        <div className="container">
          <h2 className="font-display text-xl font-semibold text-foreground text-center mb-8">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-medium text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & control */}
      <section className="border-t border-border py-10 px-4">
        <div className="container max-w-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-center sm:text-left">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Seus dados ficam apenas no seu navegador. Tudo é processado localmente e você decide onde salvar — sem cadastro e sem dependência de serviço.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Use no celular ou no computador. As alterações são salvas automaticamente no seu dispositivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-8 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap"
        >
          {onGoToTree && (
            <>
              <button
                onClick={onGoToTree}
                className="flex items-center gap-2 text-primary font-medium hover:underline"
              >
                <TreeDeciduous className="h-4 w-4" />
                Ir para minha árvore
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="hidden sm:inline text-muted-foreground">·</span>
            </>
          )}
          <button
            onClick={onAddPerson}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            {onGoToTree ? 'Adicionar pessoa' : 'Adicionar primeira pessoa'}
          </button>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <button
            onClick={onImport}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileJson className="h-4 w-4" />
            Importar arquivo JSON
          </button>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <button
            onClick={onViewExample}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Ver exemplo
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default EmptyStateLanding;
