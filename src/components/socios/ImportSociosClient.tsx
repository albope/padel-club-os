'use client';

import React, { useState } from 'react';
import { Loader2, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SocioData = {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  position?: string;
  level?: string;
  birthDate?: string;
};

const ImportSociosClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<SocioData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setImportResult(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert("El archivo debe contener una cabecera y al menos un socio.");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['name', 'email'];
      if (!requiredHeaders.every(h => headers.includes(h))) {
        alert(`La cabecera debe contener al menos las columnas: ${requiredHeaders.join(', ')}`);
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const socio: SocioData = { name: '', email: '' };
        headers.forEach((header, index) => {
          (socio as any)[header] = values[index]?.trim() || '';
        });
        return socio;
      });
      setParsedData(data);
    };
    reader.readAsText(fileToParse);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      alert("No hay datos para importar.");
      return;
    }
    setIsLoading(true);
    setImportResult(null);
    try {
      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socios: parsedData }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error en el servidor.');
      }
      setImportResult(result);
    } catch (error: any) {
      alert(`Error al importar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "name,email,password,phone,position,level,birthDate\n";
    const example = "Juan Ejemplo,juan@ejemplo.com,password123,600123123,Derecha,3.5,1990-05-15\n";
    const content = headers + example;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_socios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones y Carga de Archivo */}
      <div className="p-4 border border-dashed border-border rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Paso 1: Prepara tu archivo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          El archivo debe ser un CSV o TXT con las columnas: <code className="bg-muted px-1 rounded text-xs">name</code>, <code className="bg-muted px-1 rounded text-xs">email</code>. Opcionalmente puedes anadir: <code className="bg-muted px-1 rounded text-xs">password</code>, <code className="bg-muted px-1 rounded text-xs">phone</code>, <code className="bg-muted px-1 rounded text-xs">position</code>, <code className="bg-muted px-1 rounded text-xs">level</code>, <code className="bg-muted px-1 rounded text-xs">birthDate</code> (formato YYYY-MM-DD).
        </p>
        <Button variant="link" onClick={downloadTemplate} className="text-sm">
          Descargar plantilla de ejemplo
        </Button>
      </div>

      <div className="text-center">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Button asChild>
            <span>
              <Upload className="h-5 w-5" />
              {file ? `Archivo: ${file.name}` : 'Paso 2: Seleccionar Archivo'}
            </span>
          </Button>
        </label>
        <input id="file-upload" type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Vista Previa */}
      {parsedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vista Previa de Datos a Importar ({parsedData.length} socios)</h3>
          <Card className="overflow-auto max-h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((socio, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{socio.name}</TableCell>
                    <TableCell>{socio.email}</TableCell>
                    <TableCell>{socio.phone || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="text-center pt-4">
            <Button onClick={handleImport} disabled={isLoading} className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {isLoading ? 'Importando...' : 'Paso 3: Confirmar e Importar'}
            </Button>
          </div>
        </div>
      )}

      {/* Resultados de la Importacion */}
      {importResult && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Resultado de la Importacion</h3>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <p>{importResult.successCount} socios importados con exito.</p>
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <p>{importResult.errors.length} socios no se pudieron importar:</p>
              </div>
              <ul className="list-disc list-inside text-sm text-destructive/80 mt-2 max-h-40 overflow-auto">
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ImportSociosClient;
