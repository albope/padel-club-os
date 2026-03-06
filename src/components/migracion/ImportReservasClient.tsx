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
import { normalizarNombre } from '@/lib/import-courts';
import { parsearFecha, parsearHora, esEstadoPagoValido } from '@/lib/import-bookings';
import type { ImportError } from '@/lib/import-courts';

interface ReservaPreview {
  pista: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  email: string;
  nombreInvitado: string;
  estadoPago: string;
  numJugadores: number;
  precio: string;
  fila: number;
  duplicado: boolean;
  errores: string[];
}

interface ImportResult {
  successCount: number;
  errors: ImportError[];
  warnings: string[];
}

const ImportReservasClient = () => {
  const t = useTranslations('importBookings');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ReservaPreview[]>([]);
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

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const required = ['pista', 'fecha', 'horainicio', 'horafin'];
      const missing = required.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        alert(t('errorHeaders', { headers: missing.join(', ') }));
        return;
      }

      const idx = {
        pista: headers.indexOf('pista'),
        fecha: headers.indexOf('fecha'),
        horaInicio: headers.indexOf('horainicio'),
        horaFin: headers.indexOf('horafin'),
        email: headers.indexOf('email'),
        nombreInvitado: headers.indexOf('nombreinvitado'),
        estadoPago: headers.indexOf('estadopago'),
        numJugadores: headers.indexOf('numjugadores'),
        precio: headers.indexOf('precio'),
      };

      const errors: string[] = [];
      const reservas: ReservaPreview[] = [];
      const vistos = new Map<string, number>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const fila = i + 1;

        const pista = values[idx.pista]?.trim() || '';
        const fecha = values[idx.fecha]?.trim() || '';
        const horaInicio = values[idx.horaInicio]?.trim() || '';
        const horaFin = values[idx.horaFin]?.trim() || '';
        const email = idx.email >= 0 ? (values[idx.email]?.trim() || '') : '';
        const nombreInvitado = idx.nombreInvitado >= 0 ? (values[idx.nombreInvitado]?.trim() || '') : '';
        const estadoPago = idx.estadoPago >= 0 ? (values[idx.estadoPago]?.trim() || '') : '';
        const numJugadoresRaw = idx.numJugadores >= 0 ? (values[idx.numJugadores]?.trim() || '') : '';
        const precioRaw = idx.precio >= 0 ? (values[idx.precio]?.trim() || '') : '';

        const rowErrors: string[] = [];

        if (!pista) rowErrors.push(t('errorMissingField', { field: 'pista' }));
        if (!fecha) rowErrors.push(t('errorMissingField', { field: 'fecha' }));
        if (!horaInicio) rowErrors.push(t('errorMissingField', { field: 'horaInicio' }));
        if (!horaFin) rowErrors.push(t('errorMissingField', { field: 'horaFin' }));

        if (fecha && !parsearFecha(fecha)) rowErrors.push(t('errorInvalidDate'));
        if (horaInicio && !parsearHora(horaInicio)) rowErrors.push(t('errorInvalidTime', { field: 'horaInicio' }));
        if (horaFin && !parsearHora(horaFin)) rowErrors.push(t('errorInvalidTime', { field: 'horaFin' }));
        if (!email && !nombreInvitado) rowErrors.push(t('errorNoPlayer'));
        if (estadoPago && !esEstadoPagoValido(estadoPago)) rowErrors.push(t('errorInvalidPaymentStatus'));

        const numJugadores = numJugadoresRaw ? parseInt(numJugadoresRaw, 10) : 4;
        if (numJugadoresRaw && (isNaN(numJugadores) || numJugadores < 2 || numJugadores > 4)) {
          rowErrors.push(t('errorInvalidNumPlayers'));
        }

        if (rowErrors.length > 0) {
          errors.push(`${t('row')} ${fila}: ${rowErrors.join('; ')}`);
        }

        const key = `${normalizarNombre(pista)}|${fecha}|${horaInicio}`;
        const duplicado = vistos.has(key);
        if (!duplicado) {
          vistos.set(key, fila);
        }

        reservas.push({
          pista, fecha, horaInicio, horaFin, email, nombreInvitado,
          estadoPago, numJugadores: isNaN(numJugadores) ? 4 : numJugadores,
          precio: precioRaw, fila, duplicado, errores: rowErrors,
        });
      }

      setParseErrors(errors);
      setParsedData(reservas);
    };
    reader.readAsText(fileToParse);
  };

  const handleImport = async () => {
    const reservasValidas = parsedData.filter(p => !p.duplicado && p.errores.length === 0);
    if (reservasValidas.length === 0) {
      alert(t('errorNoData'));
      return;
    }

    setIsLoading(true);
    setImportResult(null);
    try {
      const response = await fetch('/api/bookings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservas: reservasValidas.map(r => ({
            pista: r.pista,
            fecha: r.fecha,
            horaInicio: r.horaInicio,
            horaFin: r.horaFin,
            email: r.email || undefined,
            nombreInvitado: r.nombreInvitado || undefined,
            estadoPago: r.estadoPago || undefined,
            numJugadores: r.numJugadores,
            precio: r.precio ? parseFloat(r.precio.replace(',', '.')) : undefined,
            fila: r.fila,
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
    const headers = "pista,fecha,horaInicio,horaFin,email,nombreInvitado,estadoPago,numJugadores,precio\n";
    const row1 = "Pista 1,15/04/2026,09:00,10:30,juan@email.com,,pagado,4,\n";
    const row2 = "Pista 2,15/04/2026,10:00,11:30,,Carlos Garcia,pendiente,4,20\n";
    const row3 = "Pista 1,16/04/2026,18:00,19:30,maria@email.com,,exento,2,\n";
    const content = headers + row1 + row2 + row3;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_reservas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reservasValidas = parsedData.filter(p => !p.duplicado && p.errores.length === 0);

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="p-4 border border-dashed border-border rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">{t('step1Title')}</h3>
        <p className="text-sm text-muted-foreground mb-2">{t('step1Description')}</p>
        <p className="text-sm text-muted-foreground mb-2">
          {t('step1Required')}: <code className="bg-muted px-1 rounded text-xs">pista, fecha, horaInicio, horaFin</code>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {t('step1Optional')}: <code className="bg-muted px-1 rounded text-xs">email, nombreInvitado, estadoPago, numJugadores, precio</code>
        </p>
        <Button variant="link" onClick={downloadTemplate} className="text-sm">
          {t('downloadTemplate')}
        </Button>
      </div>

      {/* Seleccionar archivo */}
      <div className="text-center">
        <label htmlFor="file-upload-reservas" className="cursor-pointer">
          <Button asChild>
            <span>
              <Upload className="h-5 w-5" />
              {file ? `${t('fileSelected')}: ${file.name}` : t('step2Title')}
            </span>
          </Button>
        </label>
        <input id="file-upload-reservas" type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Errores de parsing */}
      {parseErrors.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium text-sm">{t('parseWarnings', { count: parseErrors.length })}</p>
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
            {t('previewTitle', { count: reservasValidas.length })}
          </h3>
          <Card className="overflow-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colCourt')}</TableHead>
                  <TableHead>{t('colDate')}</TableHead>
                  <TableHead>{t('colTime')}</TableHead>
                  <TableHead>{t('colPlayer')}</TableHead>
                  <TableHead>{t('colPayment')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((reserva, index) => (
                  <TableRow
                    key={index}
                    className={reserva.duplicado || reserva.errores.length > 0 ? 'opacity-50' : ''}
                  >
                    <TableCell className="font-medium">{reserva.pista}</TableCell>
                    <TableCell>{reserva.fecha}</TableCell>
                    <TableCell>{reserva.horaInicio} - {reserva.horaFin}</TableCell>
                    <TableCell>{reserva.email || reserva.nombreInvitado || '-'}</TableCell>
                    <TableCell>{reserva.estadoPago || 'exento'}</TableCell>
                    <TableCell>
                      {reserva.duplicado && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t('warningDuplicate')}
                        </span>
                      )}
                      {reserva.errores.length > 0 && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {t('rowError')}
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
              disabled={isLoading || reservasValidas.length === 0}
              className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              {isLoading ? t('importing') : t('step3Title', { count: reservasValidas.length })}
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
          {importResult.warnings.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">{t('resultWarnings', { count: importResult.warnings.length })}</p>
              </div>
              <ul className="list-disc list-inside text-sm text-amber-600/80 dark:text-amber-400/80 mt-1 max-h-40 overflow-auto">
                {importResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {importResult.errors.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <p>{t('resultErrors', { count: importResult.errors.length })}</p>
              </div>
              <ul className="list-disc list-inside text-sm text-destructive/80 mt-1 max-h-40 overflow-auto">
                {importResult.errors.map((error, index) => (
                  <li key={index}>{t('row')} {error.fila}: {error.mensaje}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ImportReservasClient;
