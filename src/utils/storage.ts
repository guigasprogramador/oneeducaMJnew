import { supabase } from '@/integrations/supabase/client';

/**
 * Faz upload de um arquivo para um bucket do Supabase Storage.
 * @param bucket - O nome do bucket.
 * @param path - O caminho dentro do bucket onde o arquivo será armazenado.
 * @param file - O arquivo a ser enviado.
 * @returns A URL pública do arquivo.
 */
export const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (uploadError) {
    console.error('Erro no upload do arquivo:', uploadError);
    throw new Error('Falha no upload do arquivo.');
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Deleta um arquivo do Supabase Storage.
 * @param bucket - O nome do bucket.
 * @param path - O caminho do arquivo a ser deletado.
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.error('Erro ao deletar arquivo do storage:', error);
            // Não lançar erro aqui para permitir que a exclusão do registro do DB continue
        }
    } catch (error) {
        console.error('Erro inesperado ao deletar arquivo:', error);
    }
};
