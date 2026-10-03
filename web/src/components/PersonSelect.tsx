/**
 * PersonSelect — tek-merkez Personen-Register dropdown'u.
 *
 * CWS-Kernregel: "Owner/Verantwortlich" sorulan her yerde kişiler yalnızca
 * merkezî Personen-Register'dan seçilir. "+ Neue Person" bile aynı merkezî
 * register'a yazar (serbest-metin yok → hata azalır).
 *
 * PERFORMANS: bu bileşen KENDİ useToolData'sını AÇMAZ. Register'ı sayfa bir kez
 * okur ve `people` + `onAddPerson` prop olarak geçer (400 satırda 400 abonelik olmaz).
 * Owner alanı geriye-uyumlu string saklar ("Name (Title)").
 */
import { useState } from "react";
import { formatPerson, type Person } from "@/lib/personnel";

interface Props {
  value: string;
  onChange: (v: string) => void;
  people: Person[];
  onAddPerson: (p: Person) => void;
  de: boolean;
  placeholder?: string;
  className?: string;
}

export default function PersonSelect({ value, onChange, people, onAddPerson, de, placeholder, className }: Props) {
  const [adding, setAdding] = useState(false);
  const [nName, setNName] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [nTitle, setNTitle] = useState("");

  const known = people.some(p => formatPerson(p) === value);

  const add = () => {
    const name = nName.trim();
    if (!name) return;
    const p: Person = { id: crypto.randomUUID(), name, email: nEmail.trim() || undefined, title: nTitle.trim() };
    onAddPerson(p);
    onChange(formatPerson(p));
    setAdding(false); setNName(""); setNEmail(""); setNTitle("");
  };

  return (
    <div className={className}>
      <select
        value={known ? value : value ? "__free__" : ""}
        onChange={e => {
          const v = e.target.value;
          if (v === "__add__") { setAdding(true); return; }
          if (v === "__free__") return;
          onChange(v);
        }}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      >
        <option value="">{placeholder ?? (de ? "— Person wählen —" : "— select person —")}</option>
        {/* Eski/serbest değer kaybolmasın diye gösterilir */}
        {value && !known && <option value="__free__">{value}</option>}
        {people.map(p => (
          <option key={p.id} value={formatPerson(p)}>{formatPerson(p)}</option>
        ))}
        <option value="__add__">{de ? "+ Neue Person…" : "+ New person…"}</option>
      </select>

      {adding && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <input autoFocus value={nName} onChange={e => setNName(e.target.value)}
            placeholder={de ? "Name *" : "Name *"}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs w-32" />
          <input value={nEmail} onChange={e => setNEmail(e.target.value)} type="email"
            placeholder="E-Mail"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs w-40" />
          <input value={nTitle} onChange={e => setNTitle(e.target.value)}
            placeholder={de ? "Position (opt.)" : "Title (opt.)"}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs w-28" />
          <button onClick={add} className="st-ja-text text-xs px-1.5 py-1 rounded border border-border">✓</button>
          <button onClick={() => setAdding(false)} className="text-muted-foreground text-xs px-1.5 py-1 rounded border border-border">✕</button>
        </div>
      )}
    </div>
  );
}
