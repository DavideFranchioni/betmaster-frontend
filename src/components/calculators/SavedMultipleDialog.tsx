"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FolderOpen, Loader2, Trash2, Archive, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backendAPI } from "@/lib/api/backend";
import type { SavedMultipla } from "@/types/calculator";

interface SavedMultipleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculatorType: 'multiplicatore' | 'multiplicatore-coperture';
  onLoad: (multipla: SavedMultipla) => void;
}

export function SavedMultipleDialog({
  open,
  onOpenChange,
  calculatorType,
  onLoad,
}: SavedMultipleDialogProps) {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [multiple, setMultiple] = useState<SavedMultipla[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchMultiple = useCallback(async () => {
    setLoading(true);
    const res = await backendAPI.getMultiple({
      calculator_type: calculatorType,
    });
    if (res.success && res.data) {
      setMultiple(res.data);
    }
    setLoading(false);
  }, [calculatorType]);

  useEffect(() => {
    if (open) {
      fetchMultiple();
    }
  }, [open, fetchMultiple]);

  const filtered = multiple.filter((m) => m.status === tab);

  const handleLoad = (multipla: SavedMultipla) => {
    onLoad(multipla);
    onOpenChange(false);
  };

  const handleArchive = async (id: number) => {
    setActionLoading(id);
    const res = await backendAPI.archiveMultipla(id);
    if (res.success) {
      setMultiple((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'archived' as const } : m))
      );
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    const res = await backendAPI.deleteMultipla(id);
    if (res.success) {
      setMultiple((prev) => prev.filter((m) => m.id !== id));
    }
    setActionLoading(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-accent" />
            Multiple Salvate
          </DialogTitle>
          <DialogDescription>
            Seleziona una multipla da caricare nel calcolatore.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'archived')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="active">
              In Corso ({multiple.filter((m) => m.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archiviate ({multiple.filter((m) => m.status === 'archived').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {tab === 'active' ? 'Nessuna multipla salvata.' : 'Nessuna multipla archiviata.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-card hover:shadow-card-hover transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-900 truncate">{m.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Creata: {formatDate(m.created_at)}
                      {m.updated_at !== m.created_at && (
                        <> &middot; Aggiornata: {formatDate(m.updated_at)}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <Button
                      variant="back"
                      size="sm"
                      onClick={() => handleLoad(m)}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Carica
                    </Button>
                    {tab === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(m.id)}
                        disabled={actionLoading === m.id}
                      >
                        {actionLoading === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(m.id)}
                      disabled={actionLoading === m.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                    >
                      {actionLoading === m.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
