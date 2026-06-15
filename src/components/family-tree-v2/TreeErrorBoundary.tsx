import React from 'react';

class TreeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[FamilyTreeV2][ErrorBoundary] Render error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-destructive bg-destructive/5 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h2 className="font-display text-lg font-semibold text-destructive mb-1">
              Ocorreu um erro ao desenhar a árvore
            </h2>
            <p className="text-xs text-muted-foreground">
              Tente recarregar a página. Caso o problema persista, tire um print desta tela e envie para suporte.
            </p>
            {this.state.message && (
              <p className="mt-2 text-[10px] text-muted-foreground/80 break-words">
                Detalhes: {this.state.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TreeErrorBoundary;
