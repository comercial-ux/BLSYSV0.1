import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const ImagePreviewDialog = ({ isOpen, onClose, images, isLoading }) => {
  const beforeImages = images.filter(img => img.type === 'before');
  const afterImages = images.filter(img => img.type === 'after');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Visualizar Imagens da Manutenção</DialogTitle>
          <DialogDescription>
            Veja as fotos registradas antes e depois do serviço.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {beforeImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fotos (Antes)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {beforeImages.map((image, index) => (
                      <a key={`before-${index}`} href={image.url} target="_blank" rel="noopener noreferrer" className="group">
                        <img src={image.url} alt={`Antes ${index + 1}`} className="w-full h-40 object-cover rounded-md border transition-transform transform group-hover:scale-105" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {afterImages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fotos (Depois)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {afterImages.map((image, index) => (
                      <a key={`after-${index}`} href={image.url} target="_blank" rel="noopener noreferrer" className="group">
                        <img src={image.url} alt={`Depois ${index + 1}`} className="w-full h-40 object-cover rounded-md border transition-transform transform group-hover:scale-105" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {beforeImages.length === 0 && afterImages.length === 0 && (
                <p className="text-center text-muted-foreground py-10">Nenhuma imagem encontrada para esta manutenção.</p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;