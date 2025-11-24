ALTER TABLE public.checklists
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.checklists
DROP COLUMN IF EXISTS photo_url;

-- Certifique-se de que a coluna `items` pode armazenar as URLs
-- Se a coluna 'items' já existe e é JSONB, não é necessário executar esta linha.
-- Se ela não existe ou é de outro tipo, você precisará ajustar.
-- Esta linha assume que a coluna 'items' já é JSONB.

-- Modificar a política de segurança para a tabela `checklists` para incluir URLs de fotos
DROP POLICY IF EXISTS "Unified Checklist Access Policy" ON public.checklists;
CREATE POLICY "Unified Checklist Access Policy" ON public.checklists
FOR ALL
USING (auth.role() = 'authenticated');

-- Alterar a tabela para adicionar novas colunas se elas não existirem
ALTER TABLE public.checklists
ADD COLUMN IF NOT EXISTS horometer_reading numeric,
ADD COLUMN IF NOT EXISTS odometer_reading numeric;

-- Modificando a trigger `handle_new_checklist`
CREATE OR REPLACE FUNCTION public.handle_new_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  auth_header TEXT;
  checklist_data jsonb;
  equipment_name_text TEXT;
BEGIN
    auth_header := 'Bearer ' || current_setting('request.jwt.token', true);
    
    SELECT name INTO equipment_name_text FROM public.equipments WHERE id = NEW.equipment_id;
    
    checklist_data := jsonb_build_object(
      'id', NEW.id,
      'evaluation_date', to_char(NEW.evaluation_date, 'DD/MM/YYYY'),
      'evaluator', NEW.evaluator,
      'equipment_name', equipment_name_text,
      'horometer', NEW.horometer_reading,
      'link_to', '/operational/vehicle-management'
    );
    
    PERFORM net.http_post(
        url:= 'https://eqooygwoyitqeiqtynoq.supabase.co/functions/v1/trigger-notification',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', auth_header
        ),
        body:=jsonb_build_object(
            'event_type', 'checklist_created',
            'data', checklist_data
        )
    );

    IF NEW.horometer_reading IS NOT NULL THEN
        UPDATE public.equipments
        SET current_hours = NEW.horometer_reading
        WHERE id = NEW.equipment_id AND NEW.horometer_reading > COALESCE(current_hours, 0);
    END IF;

    IF NEW.odometer_reading IS NOT NULL THEN
        UPDATE public.equipments
        SET current_km = NEW.odometer_reading
        WHERE id = NEW.equipment_id AND NEW.odometer_reading > COALESCE(current_km, 0);
    END IF;

    RETURN NEW;
END;
$function$;

-- Recriar o trigger se ele foi modificado
DROP TRIGGER IF EXISTS on_new_checklist_created ON public.checklists;
CREATE TRIGGER on_new_checklist_created
AFTER INSERT ON public.checklists
FOR EACH ROW EXECUTE FUNCTION public.handle_new_checklist();