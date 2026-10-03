import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Globe, Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

const Impressum = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === "de";

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title={de ? "Impressum | UniqSuite – Dr. Sait Yalazay" : "Legal Notice | UniqSuite – Dr. Sait Yalazay"}
        description={de
          ? "Impressum gemäß § 5 DDG. Cyberwerk – Inhaber Dr. Sait Yalazay, Anbieter der UniqSuite Compliance-Plattform."
          : "Legal notice according to § 5 DDG. Cyberwerk – owned by Dr. Sait Yalazay, provider of the UniqSuite compliance platform."}
        path="/impressum"
        lang={lang}
        author="Dr. Sait Yalazay"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Dr. Sait Yalazay",
            "jobTitle": "Cybersecurity & Compliance Expert",
            "description": "Architect of UniqSuite. 20+ years in cybersecurity (NATO, UN, G20).",
            "url": "https://uniq.cyberwerk.online/impressum",
            "email": "info@cyberwerksuite.com",
            "worksFor": { "@type": "Organization", "name": "Cyberwerk", "url": "https://uniq.cyberwerk.online" },
            "knowsAbout": ["Cybersecurity", "ISO 27001", "NIS2", "DORA", "BSIG", "GDPR", "Risk Management"],
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Cyberwerk",
            "url": "https://uniq.cyberwerk.online",
            "email": "info@cyberwerksuite.com",
            "founder": { "@type": "Person", "name": "Dr. Sait Yalazay" },
            "description": "Provider of UniqSuite compliance and implementation platform.",
          },
        ]}
      />
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {de ? "Zurück" : "Back"}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Impressum</h1>
            <p className="text-sm text-muted-foreground">
              {de ? "Angaben gemäß § 5 DDG" : "Legal Notice according to § 5 DDG"}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border card-elevated p-6 sm:p-8 space-y-6 text-sm text-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {de ? "Angaben gemäß § 5 DDG" : "Information according to § 5 DDG"}
            </h2>
            <div className="space-y-1">
              <p className="font-semibold text-base">Cyberwerk</p>
              <p>{de ? "Inhaber: Dr. Sait Yalazay" : "Owner: Dr. Sait Yalazay"}</p>
              <p>{de ? "Deutschland" : "Germany"}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href="mailto:info@cyberwerksuite.com" className="text-primary hover:underline">info@cyberwerksuite.com</a>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a href="https://www.cyberwerksuite.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cyberwerksuite.com</a>
            </div>
          </section>

          <div className="border-t border-border" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {de ? "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV" : "Responsible for content according to § 18 Abs. 2 MStV"}
            </h2>
            <p>Cyberwerk</p>
            <p>{de ? "Inhaber: Dr. Sait Yalazay" : "Owner: Dr. Sait Yalazay"}</p>
            <p>E-Mail: <a href="mailto:info@cyberwerksuite.com" className="text-primary hover:underline">info@cyberwerksuite.com</a></p>
          </section>

          <div className="border-t border-border" />

          {/* Haftungsausschluss */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold font-heading">{de ? "Haftungsausschluss" : "Disclaimer"}</h2>
            <h3 className="font-semibold">{de ? "Haftung für Inhalte" : "Liability for Content"}</h3>
            <p>{de
              ? "Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich."
              : "The contents of our pages have been created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with § 7 Abs.1 DDG under general law."}</p>

            <h3 className="font-semibold mt-3">{de ? "Haftung für Links" : "Liability for Links"}</h3>
            <p>{de
              ? "Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich."
              : "Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this third-party content. The respective provider or operator of the linked pages is always responsible for the content of the linked pages."}</p>
          </section>

          {/* Urheberrecht */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold font-heading">{de ? "Urheberrecht" : "Copyright"}</h2>
            <p>{de
              ? "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."
              : "The content and works created by the site operators on these pages are subject to German copyright law. Reproduction, editing, distribution, and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator."}</p>
          </section>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            <p>{de ? "Stand: März 2026" : "Last updated: March 2026"}</p>
            <p className="mt-1">© 2026 Cyberwerk. {de ? "Alle Rechte vorbehalten." : "All rights reserved."}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Impressum;
