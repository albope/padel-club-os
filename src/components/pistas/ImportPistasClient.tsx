'use client';

import React, { useState } from 'react';
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
import { useTranslations } from 'next-intl';
import {
  normalizarNombre,
  parsearHeadersPricing,
  parsearPrecio,
  dedupPreciosIntraPista,
  type PricingRule,
  type ImportError,
} from '@/lib/import-courts';

interface PistaPreview {
  nombre: string;
  tipo: string;
  precios: PricingRule[];
  fila: number;
  duplicado: boolean;
}

interface ImportResult {
  successCount: number;
  errors: ImportError[];
  courtsCreated: { name: string; type: string; pricingRulesCount: number }[];
}

const ImportPistasClient = () => {
  const t = useTranslations('importCourts');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<PistaPreview[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setParseErrors([]);
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
        alert(t('errorMinLines'));
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());

      // Verificar columna obligatoria
      const headersLower = headers.map(h => h.toLowerCase());
      if (!headersLower.includes('nombre')) {
        alert(t('errorHeaders', { headers: 'nombre' }));
        return;
      }

      const nombreIdx = headersLower.indexOf('nombre');
      const tipoIdx = headersLower.indexOf('tipo');

      // Parsear columnas de pricing
      const { mappings: pricingMappings, errors: headerErrors } = parsearHeadersPricing(headers);
      const errors: string[] = [...headerErrors];

      // Parsear filas
      const pistas: PistaPreview[] = [];
      const nombresVistos = new Map<string, number>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const fila = i + 1; // fila 1-indexed (header es fila 1)

        const nombre = values[nombreIdx]?.trim() || '';
        if (!nombre) {
          errors.push(t('errorMissingName', { row: fila }));
          continue;
        }

        const tipo = tipoIdx >= 0 ? (values[tipoIdx]?.trim() || 'Cristal') : 'Cristal';

        // Parsear precios de esta fila
        const precios: PricingRule[] = [];
        for (const mapping of pricingMappings) {
          const rawValue = values[mapping.columnIndex]?.trim() || '';
          if (rawValue === '') continue; // Celda vacia = sin precio para esta franja

          const precio = parsearPrecio(rawValue);
          if (precio === null) {
            errors.push(t('errorInvalidPrice', { row: fila, column: mapping.headerName }));
            continue;
          }
          if (precio <= 0) {
            errors.push(t('errorPriceMustBePositive', { row: fila, column: mapping.headerName }));
            continue;
          }

          precios.push({
            dayOfWeek: mapping.dayOfWeek,
            startHour: mapping.startHour,
            endHour: mapping.endHour,
            price: precio,
          });
        }

        // Dedup pricing intra-pista
        const preciosDedup = dedupPreciosIntraPista(precios);

        // Detectar duplicados intra-CSV
        const norm = normalizarNombre(nombre);
        const duplicado = nombresVistos.has(norm);
        if (!duplicado) {
          nombresVistos.set(norm, fila);
        }

        pistas.push({ nombre, tipo, precios: preciosDedup, fila, duplicado });
      }

      setParseErrors(errors);
      setParsedData(pistas);
    };
    reader.readAsText(fileToParse);
  };

  const handleImport = async () => {
    // Filtrar duplicados intra-CSV (solo enviar las no duplicadas)
    const pistasValidas = parsedData.filter(p => !p.duplicado);
    if (pistasValidas.length === 0) {
      alert(t('errorNoData'));
      return;
    }

    setIsLoading(true);
    setImportResult(null);
    try {
      const response = await fetch('/api/courts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pistas: pistasValidas.map(p => ({
            nombre: p.nombre,
            tipo: p.tipo,
            precios: p.precios,
            fila: p.fila,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || t('errorServer'));
      }
      setImportResult(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t('errorServer');
      alert(`${t('errorImport')}: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "nombre,tipo,lunes_9-14,lunes_14-21,sabado_9-14,sabado_14-21\n";
    const row1 = "Pista 1,Cristal,20,30,25,35\n";
    const row2 = "Pista 2,Outdoor,18,25,22,30\n";
    const content = headers + row1 + row2;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_pistas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pistasNoDuplicadas = parsedData.filter(p => !p.duplicado);

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="p-4 border border-dashed border-border rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">{t('step1Title')}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          {t('step1Description')} <code className="bg-muted px-1 rounded text-xs">nombre</code>.{' '}
          {t('step1Optional')} <code className="bg-muted px-1 rounded text-xs">tipo</code> (default: Cristal).
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          {t('step1PricingExplanation')} <code className="bg-muted px-1 rounded text-xs">{t('step1PricingFormat')}</code>.
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {t('step1PricingExample')}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {t('step1DaysAvailable')}
        </p>
        <Button variant="link" onClick={downloadTemplate} className="text-sm">
          {t('downloadTemplate')}
        </Button>
      </div>

      {/* Seleccionar archivo */}
      <div className="text-center">
        <label htmlFor="file-upload-pistas" className="cursor-pointer">
          <Button asChild>
            <span>
              <Upload className="h-5 w-5" />
              {file ? `${t('fileSelected')}: ${file.name}` : t('step2Title')}
            </span>
          </Button>
        </label>
        <input id="file-upload-pistas" type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Errores de parsing */}
      {parseErrors.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium text-sm">Advertencias del archivo ({parseErrors.length})</p>
          </div>
          <ul className="list-disc list-inside text-sm text-amber-600/80 dark:text-amber-400/80 max-h-40 overflow-auto">
            {parseErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Vista Previa */}
      {parsedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {t('previewTitle', { count: pistasNoDuplicadas.length })}
          </h3>
          <Card className="overflow-auto max-h-60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colName')}</TableHead>
                  <TableHead>{t('colType')}</TableHead>
                  <TableHead>{t('colPricingRules')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((pista, index) => (
                  <TableRow key={index} className={pista.duplicado ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{pista.nombre}</TableCell>
                    <TableCell>{pista.tipo}</TableCell>
                    <TableCell>{pista.precios.length}</TableCell>
                    <TableCell>
                      {pista.duplicado && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t('warningDuplicate')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="text-center pt-4">
            <Button
              onClick={handleImport}
              disabled={isLoading || pistasNoDuplicadas.length === 0}
              className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {isLoading ? t('importing') : t('step3Title')}
            </Button>
          </div>
        </div>
      )}

      {/* Resultados */}
      {importResult && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">{t('resultTitle')}</h3>
          {importResult.successCount > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p>{t('resultSuccess', { count: importResult.successCount })}</p>
            </div>
          )}
          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <p>{t('resultErrors', { count: importResult.errors.length })}</p>
              </div>
              <ul className="list-disc list-inside text-sm text-destructive/80 mt-2 max-h-40 overflow-auto">
                {importResult.errors.map((error, index) => (
                  <li key={index}>Fila {error.fila}: {error.mensaje}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ImportPistasClient;
