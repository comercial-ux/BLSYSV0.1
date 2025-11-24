import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

const AttachmentViewerDialog = ({ isOpen, onClose, fileUrl, fileName, fileType, isLoading }) => {
  const isImage = fileType?.startsWith('image/');
  const isPdf = fileType === 'application/pdf';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando anexo...</p>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-destructive">Não foi possível carregar o anexo.</p>
        </div>
      );
    }

    if (isImage) {
      return <img-replace src={fileUrl} alt={fileName} className="max-w-full max-h-full object-contain" />;
    }

    if (isPdf) {
      return <iframe src={fileUrl} title={fileName} className="w-full h-full border-0" />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-lg font-semibold mb-2">Visualização não suportada</p>
        <p className="text-muted-foreground mb-4">O arquivo "{fileName}" não pode ser exibido diretamente.</p>
        <Button asChild>
          <a href={fileUrl} download={fileName}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Arquivo
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">{fileName || 'Visualizador de Anexo'}</DialogTitle>
          <DialogDescription>Visualize ou baixe o documento anexado.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow p-2 overflow-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerDialog;