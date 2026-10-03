import { useRef, useState } from "react";
import { Users, Plus, Trash2, Pencil, Check, X, Mail, Download, Upload, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import {
  type Person,
  type PersonnelRegistry,
  DEFAULT_PERSONNEL,
  PERSONNEL_TOOL_KEY,
  PERSONNEL_LS_KEY,
} from "@/lib/personnel";
import {
  downloadPersonnelCsv,
  downloadPersonnelCsvTemplate,
  parsePersonnelCsv,
} from "@/lib/personnelCsv";
import { generatePersonnelReportPDF, generatePersonnelReportWord } from "@/lib/personnelReport";
import { getReportBrandName } from "@/lib/reportBrand";
import { isValidEmail } from "@/lib/notificationSettings";
import { toast } from "sonner";

const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function PersonnelManager() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData } = useToolData<PersonnelRegistry>(
    PERSONNEL_TOOL_KEY,
    PERSONNEL_LS_KEY,
    DEFAULT_PERSONNEL
  );

  const [draft, setDraft] = useState<{ name: string; title: string; department: string; email: string }>({
    name: "", title: "", department: "", email: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Person | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const people = data.people ?? [];

  const handleExportCsv = () => {
    if (people.length === 0) {
      toast.error(de ? "Keine Personen zum Exportieren" : "No persons to export");
      return;
    }
    downloadPersonnelCsv(people, `personnel-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(de ? "CSV exportiert ✓" : "CSV exported ✓");
  };

  const handleImportCsv = async (file: File) => {
    try {
      const text = await file.text();
      const { people: imported, errors, skipped } = parsePersonnelCsv(text);
      if (errors.length) {
        toast.error(errors.join("; "));
        return;
      }
      if (imported.length === 0) {
        toast.error(de ? "Keine gültigen Zeilen gefunden" : "No valid rows found");
        return;
      }
      // De-duplicate by name+email (case-insensitive)
      const key = (p: Person) => `${p.name.toLowerCase()}|${(p.email ?? "").toLowerCase()}`;
      const existing = new Set(people.map(key));
      const fresh = imported.filter(p => !existing.has(key(p)));
      setData({ people: [...people, ...fresh] });
      toast.success(
        de
          ? `${fresh.length} importiert · ${imported.length - fresh.length} Duplikate · ${skipped} übersprungen`
          : `${fresh.length} imported · ${imported.length - fresh.length} duplicates · ${skipped} skipped`
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const addPerson = () => {
    const name = draft.name.trim();
    const title = draft.title.trim();
    const email = draft.email.trim();
    if (!name || !title) {
      toast.error(de ? "Name und Titel sind erforderlich" : "Name and title are required");
      return;
    }
    if (email && !isValidEmail(email)) {
      toast.error(de ? "Ungültige E-Mail-Adresse" : "Invalid e-mail address");
      return;
    }
    const p: Person = {
      id: newId(),
      name,
      title,
      department: draft.department.trim() || undefined,
      email: email || undefined,
    };
    setData({ people: [...people, p] });
    setDraft({ name: "", title: "", department: "", email: "" });
    toast.success(de ? "Person hinzugefügt ✓" : "Person added ✓");
  };

  const removePerson = (id: string) => {
    setData({ people: people.filter(p => p.id !== id) });
  };

  const startEdit = (p: Person) => {
    setEditId(p.id);
    setEditDraft({ ...p });
  };

  const saveEdit = () => {
    if (!editDraft || !editDraft.name.trim() || !editDraft.title.trim()) return;
    const email = (editDraft.email ?? "").trim();
    if (email && !isValidEmail(email)) {
      toast.error(de ? "Ungültige E-Mail-Adresse" : "Invalid e-mail address");
      return;
    }
    setData({
      people: people.map(p =>
        p.id === editDraft.id
          ? {
              ...editDraft,
              name: editDraft.name.trim(),
              title: editDraft.title.trim(),
              department: editDraft.department?.trim() || undefined,
              email: email || undefined,
            }
          : p
      ),
    });
    setEditId(null);
    setEditDraft(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {de ? "Verantwortliche Personen" : "Responsible Persons"}
          {people.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {people.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {de
            ? "Diese Personen stehen in allen späteren Schritten (Asset-Owner, Risiko-Behandlung, Maßnahmen-Owner, Auditor) zur Auswahl. Mit hinterlegter E-Mail erhalten sie automatische Frist-Erinnerungen."
            : "These persons appear in all later steps (asset owner, risk treatment, action owner, auditor) for selection. When an e-mail is provided, they receive automatic deadline reminders."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CSV toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-dashed border-[hsl(var(--accent-h)_var(--accent-s)_45%/0.5)]">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground mr-auto">
            {de ? "CSV-Vorlage, Import & Export" : "CSV template, import & export"}
          </span>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => downloadPersonnelCsvTemplate()}>
            <Download className="h-3.5 w-3.5" />
            {de ? "Vorlage" : "Template"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            {de ? "CSV importieren" : "Import CSV"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleExportCsv}>
            <Download className="h-3.5 w-3.5" />
            {de ? "CSV exportieren" : "Export CSV"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportCsv(f);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* Report toolbar — IT-Sicherheits-Organigramm */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-dashed border-[hsl(var(--accent-h)_var(--accent-s)_45%/0.5)]">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground mr-auto">
            {de
              ? "IT-Sicherheits-Organigramm als Bericht exportieren"
              : "Export IT security organization chart as report"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            disabled={people.length === 0}
            onClick={async () => {
              try {
                await generatePersonnelReportPDF(people, {
                  companyName: getReportBrandName(de),
                  lang: de ? "de" : "en",
                });
                toast.success(de ? "PDF erstellt ✓" : "PDF generated ✓");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            {de ? "PDF-Bericht" : "PDF Report"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            disabled={people.length === 0}
            onClick={async () => {
              try {
                await generatePersonnelReportWord(people, {
                  companyName: getReportBrandName(de),
                  lang: de ? "de" : "en",
                });
                toast.success(de ? "Word erstellt ✓" : "Word generated ✓");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            <FileType className="h-3.5 w-3.5" />
            {de ? "Word-Bericht" : "Word Report"}
          </Button>
        </div>

        {/* List */}
        {people.length > 0 && (
          <div className="space-y-2">
            {people.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                {editId === p.id && editDraft ? (
                  <>
                    <div className="flex-1 grid gap-1.5 sm:grid-cols-2">
                      <Input
                        className="h-8"
                        value={editDraft.name}
                        onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
                        placeholder={de ? "Name" : "Name"}
                      />
                      <Input
                        className="h-8"
                        value={editDraft.title}
                        onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                        placeholder={de ? "Titel / Rolle" : "Title / Role"}
                      />
                      <Input
                        className="h-8"
                        value={editDraft.department ?? ""}
                        onChange={e => setEditDraft({ ...editDraft, department: e.target.value })}
                        placeholder={de ? "Abteilung" : "Department"}
                      />
                      <Input
                        className="h-8"
                        type="email"
                        value={editDraft.email ?? ""}
                        onChange={e => setEditDraft({ ...editDraft, email: e.target.value })}
                        placeholder={de ? "E-Mail (optional)" : "E-mail (optional)"}
                      />
                    </div>
                    <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(null); setEditDraft(null); }}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.title}{p.department ? ` · ${p.department}` : ""}
                      </div>
                      {p.email && (
                        <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {p.email}
                        </div>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removePerson(p.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add row */}
        <div className="grid gap-2 sm:grid-cols-2 items-end">
          <div>
            <Label className="text-xs">{de ? "Name" : "Name"}</Label>
            <Input
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder={de ? "z.B. Max Mustermann" : "e.g. Jane Doe"}
            />
          </div>
          <div>
            <Label className="text-xs">{de ? "Titel / Rolle" : "Title / Role"}</Label>
            <Input
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder={de ? "z.B. CISO" : "e.g. CISO"}
            />
          </div>
          <div>
            <Label className="text-xs">{de ? "Abteilung" : "Department"}</Label>
            <Input
              value={draft.department}
              onChange={e => setDraft(d => ({ ...d, department: e.target.value }))}
              placeholder={de ? "z.B. IT" : "e.g. IT"}
            />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {de ? "E-Mail (für Frist-Erinnerungen)" : "E-mail (for deadline reminders)"}
            </Label>
            <Input
              type="email"
              value={draft.email}
              onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
              placeholder="max@firma.de"
            />
          </div>
          <Button onClick={addPerson} className="gap-1 sm:col-span-2">
            <Plus className="h-4 w-4" />
            {de ? "Hinzufügen" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
