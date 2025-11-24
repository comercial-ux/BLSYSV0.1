import React, { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon } from 'lucide-react';

const ImageSourceDialog = ({ open, onOpenChange, onFileSelect }) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files);
    }
    onOpenChange(false);
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selecione a fonte da imagem</AlertDialogTitle>
            <AlertDialogDescription>
              Você quer tirar uma nova foto com a câmera ou escolher uma existente na sua galeria?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col sm:space-x-0 sm:gap-2">
            <Button onClick={triggerCamera} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Tirar Foto com a Câmera
            </Button>
            <Button onClick={triggerGallery} className="w-full">
              <ImageIcon className="mr-2 h-4 w-4" />
              Escolher da Galeria
            </Button>
            <AlertDialogCancel className="w-full mt-2">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageSourceDialog;