import { useState } from 'react';
import { generatedDocumentService, GeneratedDocument } from '@/services/generatedDocumentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const VerifyDocument = () => {
  const [authCode, setAuthCode] = useState('');
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!authCode.trim()) {
      toast.warning('Please enter a verification code.');
      return;
    }
    setIsLoading(true);
    setSearched(false);
    try {
      const result = await generatedDocumentService.verifyDocumentByAuthCode(authCode.trim());
      setDocument(result);
    } catch (error) {
      console.error('Verification failed:', error);
      // The service toasts on error, so we don't need another one here.
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  };

  const handleNewSearch = () => {
    setDocument(null);
    setSearched(false);
    setAuthCode('');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Verificação de Documento</h1>

        {!document && (
          <Card>
            <CardHeader>
              <CardTitle>Verificar Autenticidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Insira o código de autenticação encontrado no documento para verificar sua validade.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Ex: DECL-A1B2C3D4"
                  className="flex-grow"
                />
                <Button onClick={handleVerify} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Verificar
                </Button>
              </div>
              {searched && !document && (
                <p className="text-red-500 mt-4 text-center">
                  Documento não encontrado. Verifique o código e tente novamente.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {document && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-green-600">Documento Válido</CardTitle>
              </CardHeader>
              <CardContent>
                <p>O documento com o código <strong>{document.authenticationCode}</strong> é autêntico e foi emitido em {new Date(document.issueDate).toLocaleDateString('pt-BR')}.</p>
              </CardContent>
            </Card>

            <div
              className="border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: document.contentHtml }}
            />

            <div className="text-center mt-6">
              <Button onClick={handleNewSearch}>
                Verificar Outro Documento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyDocument;
